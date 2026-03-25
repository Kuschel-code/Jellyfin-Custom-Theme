using System;
using System.IO;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// Injects the headerButton.js script tag into Jellyfin's index.html responses
    /// without modifying any files on disk. Works in Docker read-only filesystems.
    /// </summary>
    public class ScriptInjectionStartup : IStartupFilter
    {
        private const string ScriptTag = "<script src=\"/web/configurationpage?name=custom-theme-headerjs\"></script>";

        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
        {
            return app =>
            {
                app.Use(async (context, nextMiddleware) =>
                {
                    var path = context.Request.Path.Value ?? "";

                    // Only intercept the main web UI pages
                    if (!IsWebUIRequest(path))
                    {
                        await nextMiddleware();
                        return;
                    }

                    // Capture the response
                    var originalBody = context.Response.Body;
                    using var memStream = new MemoryStream();
                    context.Response.Body = memStream;

                    await nextMiddleware();

                    memStream.Seek(0, SeekOrigin.Begin);
                    var responseBody = await new StreamReader(memStream).ReadToEndAsync();

                    // Only inject into HTML responses that don't already have our script
                    if (context.Response.ContentType?.Contains("text/html", StringComparison.OrdinalIgnoreCase) == true
                        && responseBody.Contains("</body>", StringComparison.OrdinalIgnoreCase)
                        && !responseBody.Contains("custom-theme-headerjs", StringComparison.OrdinalIgnoreCase))
                    {
                        responseBody = responseBody.Replace(
                            "</body>",
                            ScriptTag + "\n</body>",
                            StringComparison.OrdinalIgnoreCase);
                    }

                    var bytes = Encoding.UTF8.GetBytes(responseBody);
                    context.Response.Body = originalBody;
                    context.Response.ContentLength = bytes.Length;
                    await originalBody.WriteAsync(bytes);
                });

                next(app);
            };
        }

        private static bool IsWebUIRequest(string path)
        {
            return path.Equals("/web/index.html", StringComparison.OrdinalIgnoreCase)
                || path.Equals("/web/", StringComparison.OrdinalIgnoreCase)
                || path.Equals("/web", StringComparison.OrdinalIgnoreCase)
                || path.Equals("/", StringComparison.OrdinalIgnoreCase);
        }
    }
}
