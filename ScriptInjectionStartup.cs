using System;
using System.IO;
using System.IO.Pipelines;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// Injects the headerButton.js script tag into Jellyfin's index.html responses
    /// without modifying any files on disk. Works in Docker read-only filesystems.
    ///
    /// Key fix: Replaces IHttpResponseBodyFeature to prevent SendFileAsync from
    /// bypassing our response capture stream (Jellyfin's static file middleware
    /// uses SendFileAsync which writes directly to the socket, skipping any
    /// middleware response body substitution).
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

                    if (!IsWebUIRequest(path))
                    {
                        await nextMiddleware();
                        return;
                    }

                    // Save original body and response body feature
                    var originalBody = context.Response.Body;
                    var originalBodyFeature = context.Features.Get<IHttpResponseBodyFeature>();

                    // Replace with a memory stream that forces all writes through it
                    // (prevents SendFileAsync from bypassing our capture)
                    using var memStream = new MemoryStream();
                    context.Response.Body = memStream;
                    context.Features.Set<IHttpResponseBodyFeature>(
                        new StreamResponseBodyFeature(memStream));

                    await nextMiddleware();

                    // Read captured response
                    memStream.Seek(0, SeekOrigin.Begin);
                    var responseBody = await new StreamReader(memStream).ReadToEndAsync();

                    // Restore original features
                    context.Response.Body = originalBody;
                    if (originalBodyFeature != null)
                        context.Features.Set(originalBodyFeature);

                    // Inject script tag into HTML responses
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
