using System;
using System.IO;
using System.Collections.Generic;
using System.Reflection;
using System.Linq;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using WebServer;

namespace MapViewServer
{
    [AttributeUsage(AttributeTargets.Class)]
    internal class PackageResourceAttribute : Attribute
    {
        public string Extension { get; set; }
        
        public PackageResourceAttribute(string extension)
        {
            Extension = extension;
        }
    }
    
    [ServletUrl(ServletUrlPrefix)]
    public class VpkBrowseServlet : HtmlServlet
    {
        public const string ServletUrlPrefix = "/vpk";
        
        private static readonly Regex _sRepeatedSepRegex = new Regex("//+", RegexOptions.Compiled);
        
        private static string JoinUrl(params string[] parts)
        {
            return _sRepeatedSepRegex.Replace(string.Join("/", parts.Where(x => x.Length > 0)), "/");
        }
        
        private static Dictionary<string, Func<ResourceServlet>> _sResourceServletCtors;
            
        private static Dictionary<string, Func<ResourceServlet>> FindResourceServletCtors()
        {
            var dict = new Dictionary<string, Func<ResourceServlet>>(
                StringComparer.InvariantCultureIgnoreCase
            );
            
            foreach (var type in typeof(VpkBrowseServlet).Assembly.GetTypes())
            {
                if (!typeof(ResourceServlet).IsAssignableFrom(type)) continue;
                
                var attribs = type.GetCustomAttributes<PackageResourceAttribute>(true);
                if (attribs.Count() == 0) continue;
                
                var ctor = type.GetConstructor(Type.EmptyTypes);
                var call = Expression.New(ctor);
                var conv = Expression.Convert(call, typeof(ResourceServlet));
                var lamb = Expression.Lambda<Func<ResourceServlet>>(conv).Compile();
                
                foreach (var attrib in attribs)
                {
                    dict.Add(attrib.Extension, lamb);
                }
            }
                
            return dict;
        }
        
        private static bool CanCreateResourceServlet(string extension)
        {
            if (_sResourceServletCtors == null)
            {
                _sResourceServletCtors = FindResourceServletCtors();
            }
            
            return _sResourceServletCtors.ContainsKey(extension);
        }
            
        private static bool TryCreateResourceServlet(string extension, out ResourceServlet servlet)
        {
            if (_sResourceServletCtors == null)
            {
                _sResourceServletCtors = FindResourceServletCtors();
            }
            
            Func<ResourceServlet> ctor;
            if (_sResourceServletCtors.TryGetValue(extension, out ctor))
            {
                servlet = ctor();
                return true;
            }
            
            servlet = null;
            return false;
        }
        
        private Tag DirectoryEntry(string label, string url = null)
        {
            if (url == null) return T("li")(label);
            return T("li")(T("a", href => JoinUrl(ServletUrlPrefix, url))(label));
        }
        
        protected override void OnService()
        {
            var path = JoinUrl(SplitUrl(Request.RawUrl).Skip(1).ToArray());
            var parent = path.Length > 1 ? Path.GetDirectoryName(path) : null;
            
            var extStart = path.LastIndexOf('.');
            if (extStart != -1)
            {
                var ext = path.Substring(extStart);
                ResourceServlet servlet;
                if (TryCreateResourceServlet(ext, out servlet))
                {
                    servlet.Service(Request, Response, path);
                }
                else
                {
                    Response.StatusCode = 403;
                }
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
                                var ext = Path.GetExtension(file);
                                if (CanCreateResourceServlet(ext))
                                {
                                    Write(DirectoryEntry(file, JoinUrl(path, file + "?format=preview")));
                                }
                                else
                                {
                                    Write(DirectoryEntry(file));
                                }
                            }
                        }))
                    )
                )
            );
        }
    }
}
