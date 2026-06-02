using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
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

        private static bool OwnInjectionEnabled()
        {
            try
            {
                return Plugin.Instance?.Configuration?.OwnInjection ?? false;
            }
            catch
            {
                return false;
            }
        }

        private static bool ProvideFtEnabled()
        {
            try
            {
                return Plugin.Instance?.Configuration?.ProvideFileTransformation ?? false;
            }
            catch
            {
                return false;
            }
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var ownInjection = OwnInjectionEnabled();
            var provideFt = ProvideFtEnabled();

            if (!IsIndexRequest(context.Request.Path) || (!ownInjection && !provideFt))
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
                    var working = html;

                    // 1) Our own header/hero script.
                    if (ownInjection)
                    {
                        working = ThemeTransformation.InjectInto(ThemeTransformation.StripInjected(working));
                    }

                    // 2) Transformations registered by other plugins (e.g. Media Bar) through
                    //    the bundled File Transformation provider.
                    if (provideFt)
                    {
                        working = ApplyRegisteredTransformations(working);
                    }

                    if (!string.Equals(working, html, StringComparison.Ordinal))
                    {
                        output = working;
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

        /// <summary>Applies every transformation other plugins registered through the bundled provider.</summary>
        private static string ApplyRegisteredTransformations(string html)
        {
            foreach (var reg in Jellyfin.Plugin.FileTransformation.PluginInterface.GetRegistrations())
            {
                try
                {
                    if (!MatchesIndex(reg.FileNamePattern))
                    {
                        continue;
                    }

                    var transformed = InvokeCallback(reg, html);
                    if (!string.IsNullOrEmpty(transformed))
                    {
                        html = transformed;
                    }
                }
                catch
                {
                    // One bad transformation must never break the page.
                }
            }

            return html;
        }

        private static bool MatchesIndex(string pattern)
        {
            if (string.IsNullOrEmpty(pattern))
            {
                return true;
            }

            try
            {
                return Regex.IsMatch("index.html", pattern, RegexOptions.IgnoreCase);
            }
            catch
            {
                return pattern.IndexOf("index", StringComparison.OrdinalIgnoreCase) >= 0;
            }
        }

        private static string? InvokeCallback(Jellyfin.Plugin.FileTransformation.TransformationRegistration reg, string html)
        {
            var want = reg.CallbackAssembly;
            var asm = AssemblyLoadContext.All.SelectMany(c => c.Assemblies).FirstOrDefault(a =>
                string.Equals(a.FullName, want, StringComparison.Ordinal)
                || string.Equals(a.GetName().Name, want, StringComparison.Ordinal)
                || (want != null && want.StartsWith(a.GetName().Name + ",", StringComparison.Ordinal)));

            var type = asm?.GetType(reg.CallbackClass);
            var method = type?.GetMethod(reg.CallbackMethod, BindingFlags.Public | BindingFlags.Static | BindingFlags.Instance);
            if (method is null)
            {
                return null;
            }

            var parameters = method.GetParameters();
            if (parameters.Length != 1)
            {
                return null;
            }

            object arg;
            var paramType = parameters[0].ParameterType;
            if (paramType == typeof(string))
            {
                arg = html;
            }
            else
            {
                // The real File Transformation plugin passes { "contents": "..." } and
                // deserializes it into the callback's own payload type. Mirror that.
                var payloadJson = JsonSerializer.Serialize(new { contents = html });
                arg = JsonSerializer.Deserialize(payloadJson, paramType, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }

            var target = method.IsStatic ? null : Activator.CreateInstance(type);
            return method.Invoke(target, new[] { arg }) as string;
        }
    }
}
