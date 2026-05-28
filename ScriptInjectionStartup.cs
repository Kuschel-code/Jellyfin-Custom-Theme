using System;
using System.IO;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Hosting;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// Injects the headerButton.js script tag into Jellyfin's web index responses
    /// on the fly, without modifying any files on disk. This makes the optional
    /// header settings button work on read-only / Docker installations.
    ///
    /// Jellyfin's static file middleware uses SendFileAsync, which writes directly
    /// to the socket and bypasses ordinary response-body substitution. We therefore
    /// also replace <see cref="IHttpResponseBodyFeature"/> with a buffer so the
    /// response is captured before we forward it.
    /// </summary>
    public class ScriptInjectionStartup : IStartupFilter
    {
        private const string Marker = "custom-theme-headerjs";
        private const string ScriptTag = "<script defer src=\"/web/configurationpage?name=custom-theme-headerjs\"></script>";

        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
        {
            return app =>
            {
                app.Use(async (context, nextMiddleware) =>
                {
                    if (!IsWebIndexRequest(context.Request.Path.Value))
                    {
                        await nextMiddleware();
                        return;
                    }

                    var originalBody = context.Response.Body;
                    var originalBodyFeature = context.Features.Get<IHttpResponseBodyFeature>();

                    using var buffer = new MemoryStream();
                    context.Response.Body = buffer;
                    context.Features.Set<IHttpResponseBodyFeature>(new StreamResponseBodyFeature(buffer));

                    try
                    {
                        await nextMiddleware();
                    }
                    finally
                    {
                        context.Response.Body = originalBody;
                        if (originalBodyFeature is not null)
                        {
                            context.Features.Set(originalBodyFeature);
                        }
                    }

                    buffer.Seek(0, SeekOrigin.Begin);

                    var isHtml = context.Response.ContentType?.Contains("text/html", StringComparison.OrdinalIgnoreCase) == true;
                    var isEncoded = !string.IsNullOrEmpty(context.Response.Headers.ContentEncoding);

                    if (isHtml && !isEncoded)
                    {
                        var html = await new StreamReader(buffer, Encoding.UTF8).ReadToEndAsync();

                        if (!html.Contains(Marker, StringComparison.OrdinalIgnoreCase) &&
                            html.Contains("</body>", StringComparison.OrdinalIgnoreCase))
                        {
                            html = html.Replace("</body>", ScriptTag + "\n</body>", StringComparison.OrdinalIgnoreCase);
                        }

                        var bytes = Encoding.UTF8.GetBytes(html);
                        context.Response.ContentLength = bytes.Length;
                        await originalBody.WriteAsync(bytes);
                    }
                    else
                    {
                        // Not HTML or already compressed — forward verbatim.
                        context.Response.ContentLength = buffer.Length;
                        await buffer.CopyToAsync(originalBody);
                    }
                });

                next(app);
            };
        }

        private static bool IsWebIndexRequest(string? path)
        {
            return path is not null
                && (path.Equals("/web/index.html", StringComparison.OrdinalIgnoreCase)
                    || path.Equals("/web/", StringComparison.OrdinalIgnoreCase)
                    || path.Equals("/web", StringComparison.OrdinalIgnoreCase)
                    || path.Equals("/", StringComparison.OrdinalIgnoreCase));
        }
    }
}
