using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// Self-contained index.html injection. An ASP.NET middleware injects the
    /// header/hero script into <c>/web/index.html</c> at serve time, so the plugin no
    /// longer needs the File Transformation plugin (nor a writable web root). It is
    /// deliberately defensive:
    /// <list type="bullet">
    /// <item>only ever touches the SPA entry (<c>/web/index.html</c>, <c>/web/</c>, <c>/web</c>);
    /// every other request is passed straight through untouched,</item>
    /// <item>dedupes via <see cref="ThemeTransformation.Marker"/>, so it never doubles
    /// up with the File Transformation plugin or an on-disk copy,</item>
    /// <item>on ANY error it serves the original bytes unchanged,</item>
    /// <item>can be turned off at runtime via the <c>OwnInjection</c> setting (the
    /// File Transformation / on-disk paths remain as a fallback).</item>
    /// </list>
    /// </summary>
    public sealed class IndexInjectionStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
        {
            return app =>
            {
                app.UseMiddleware<IndexInjectionMiddleware>();
                next(app);
            };
        }
    }

    /// <summary>The injection middleware itself.</summary>
    public sealed class IndexInjectionMiddleware
    {
        private readonly RequestDelegate _next;

        public IndexInjectionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        private static bool IsIndexRequest(PathString path)
        {
            var p = path.Value ?? string.Empty;
            return p.Equals("/web/index.html", StringComparison.OrdinalIgnoreCase)
                || p.Equals("/web/", StringComparison.OrdinalIgnoreCase)
                || p.Equals("/web", StringComparison.OrdinalIgnoreCase);
        }

        private static bool Enabled()
        {
            try
            {
                var plugin = Plugin.Instance;
                if (plugin?.Configuration == null)
                {
                    return false;
                }

                return plugin.Configuration.OwnInjection;
            }
            catch
            {
                return false;
            }
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (!IsIndexRequest(context.Request.Path) || !Enabled())
            {
                await _next(context).ConfigureAwait(false);
                return;
            }

            var originalBodyFeature = context.Features.Get<IHttpResponseBodyFeature>();
            using var buffer = new MemoryStream();
            context.Features.Set<IHttpResponseBodyFeature>(new StreamResponseBodyFeature(buffer));

            try
            {
                await _next(context).ConfigureAwait(false);
            }
            catch
            {
                // Restore and flush whatever was captured so the request still completes.
                context.Features.Set(originalBodyFeature);
                if (buffer.Length > 0)
                {
                    await context.Response.Body.WriteAsync(buffer.ToArray()).ConfigureAwait(false);
                }

                throw;
            }

            // Restore the real response body before writing the result.
            context.Features.Set(originalBodyFeature);

            string html = null;
            try
            {
                html = Encoding.UTF8.GetString(buffer.ToArray());
            }
            catch
            {
                html = null;
            }

            string output = null;
            if (html != null
                && context.Response.StatusCode == 200
                && html.IndexOf("</body>", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                try
                {
                    var injected = ThemeTransformation.InjectInto(ThemeTransformation.StripInjected(html));
                    if (!string.Equals(injected, html, StringComparison.Ordinal))
                    {
                        output = injected;
                    }
                }
                catch
                {
                    output = null;
                }
            }

            byte[] bytes = output != null ? Encoding.UTF8.GetBytes(output) : buffer.ToArray();
            if (output != null)
            {
                // The modified document changes length; never let a cached/stale length
                // or ETag cause a ChunkLoadError.
                context.Response.Headers.Remove("ETag");
                context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            }

            context.Response.ContentLength = bytes.Length;
            await context.Response.Body.WriteAsync(bytes).ConfigureAwait(false);
        }
    }
}
