using System.IO;
using WebServer;

[ServletUrl("/vpk")]
public class VpkBrowseServlet : HtmlServlet
{
    protected override void OnService()
    {
        var path = Request.RawUrl.Substring("/vpk".Length);
        if (path.StartsWith("/")) path = path.Substring(1);
        if (path.EndsWith("/")) path = path.Substring(0, path.Length - 1);
        
        var parent = path.Length > 0 ? Path.GetDirectoryName(path) : null;
        
        var directories = Program.Loader.GetDirectories(path);
        var files = Program.Loader.GetFiles(path);
        
        path = "/" + path;
        
        Write(
            DocType("html"),
            T("html", lang => "en")(
                T("head")(
                    T("title")($"VPK Browser")
                ),
                T("body")(
                    T("h2")($"Contents of {path}"),
                    T("ul")(T(() => {
                        if (parent != null) Write(T("li")(T("a", href => $"/vpk/{parent}")("..")));
                        if (path == "/") path = "";
                        
                        foreach (var dir in directories)
                        {
                            Write(T("li")(
                                T("a", href => $"/vpk{path}/{dir}")(dir)
                            ));
                        }
                        
                        foreach (var file in files)
                        {
                            Write(T("li")(
                                file
                            ));
                        }
                    }))
                )
            )
        );
    }
}
