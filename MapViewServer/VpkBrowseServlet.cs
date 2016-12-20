using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using WebServer;
using SourceUtils;

namespace MapViewServer
{
    [ServletUrl(ServletUrlPrefix)]
    public class VpkBrowseServlet : HtmlServlet
    {
        public const string ServletUrlPrefix = "/vpk";
        
        private static readonly Regex _sRepeatedSepRegex = new Regex("//+", RegexOptions.Compiled);
        
        private static string JoinUrl(params string[] parts)
        {
            return _sRepeatedSepRegex.Replace(string.Join("/", parts.Where(x => x.Length > 0)), "/");
        }
        
        private Tag DirectoryEntry(string label, string url)
        {
            return T("li")(T("a", href => JoinUrl(ServletUrlPrefix, url))(label));
        }
        
        protected override void OnService()
        {
            var path = JoinUrl(SplitUrl(Request.RawUrl).Skip(1).ToArray());
            var parent = path.Length > 1 ? Path.GetDirectoryName(path) : null;
            
            if (path.EndsWith(".vmt"))
            {
                new VmtServlet().Service(Request, Response, path);
                return;
            }
            
            if (path.EndsWith(".vtf"))
            {
                new VtfServlet().Service(Request, Response, path);
                return;
            }
            
            Write(
                DocType("html"),
                T("html", lang => "en")(
                    T("head")(
                        T("title")($"VPK Browser")
                    ),
                    T("body")(
                        T("h2")($"Contents of /{path}"),
                        T("ul")(T(() => {
                            if (parent != null) Write(DirectoryEntry("..", parent));
                            
                            var directories = Program.Loader.GetDirectories(path);
                            var files = Program.Loader.GetFiles(path);
                            
                            foreach (var dir in directories)
                            {
                                Write(DirectoryEntry(dir, JoinUrl(path, dir)));
                            }
                            
                            foreach (var file in files)
                            {
                                Write(DirectoryEntry(file, JoinUrl(path, file)));
                            }
                        }))
                    )
                )
            );
        }
    }
}
