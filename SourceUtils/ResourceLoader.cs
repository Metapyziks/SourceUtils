using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using System.IO;

namespace SourceUtils
{    
    public interface IResourceProvider
    {
        IEnumerable<string> GetFiles(string directory = "");
        IEnumerable<string> GetDirectories(string directory = "");
        
        bool ContainsFile(string filePath);
        Stream OpenFile(string filePath);
    }
    
    [AttributeUsage(AttributeTargets.Class)]
    public class PathPrefixAttribute : Attribute
    {
        public string Value { get; set; }
        
        public PathPrefixAttribute(string value)
        {
            Value = value;
        }
    }

    public class FSLoader : IResourceProvider
    {
        private string root;

        public FSLoader(string directory = "")
        {
            root = directory;
        }

        public bool ContainsFile(string filePath)
        {
            return File.Exists(Path.Combine(root, filePath));
        }

        public IEnumerable<string> GetDirectories(string directory = "")
        {
            return Directory.GetDirectories(Path.Combine(root, directory));
        }

        public IEnumerable<string> GetFiles(string directory = "")
        {
            return Directory.GetFiles(Path.Combine(root, directory));
        }

        public Stream OpenFile(string filePath)
        {
            return File.OpenRead(Path.Combine(root, filePath));
        }
    }

    public class ResourceLoader : IResourceProvider
    {
        private readonly List<IResourceProvider> _providers = new List<IResourceProvider>();

        public void AddResourceProvider(IResourceProvider provider)
        {
            _providers.Add(provider);
        }

        public void RemoveResourceProvider(IResourceProvider provider)
        {
            _providers.Remove(provider);
        }
        
        public IEnumerable<string> GetFiles(string directory = "")
        {
            return _providers.SelectMany(x => x.GetFiles(directory)).OrderBy( x => x );
        }
        
        public IEnumerable<string> GetDirectories(string directory = "")
        {
            return _providers.SelectMany(x => x.GetDirectories(directory)).OrderBy( x => x );
        }

        public bool ContainsFile(string filePath)
        {
            for (var i = _providers.Count - 1; i >= 0; --i)
            {
                if (_providers[i].ContainsFile(filePath)) return true;
            }

            return false;
        }

        public Stream OpenFile(string filePath)
        {
            for (var i = _providers.Count - 1; i >= 0; --i)
            {
                if (_providers[i].ContainsFile(filePath)) return _providers[i].OpenFile(filePath);
            }

            return _providers[0].OpenFile(filePath);
        }

        private abstract class ResourceCollection
        {
            private readonly ResourceLoader _loader;
            private readonly string _pathPrefix;
            
            private readonly Dictionary<string, object> _loaded
                = new Dictionary<string, object>(StringComparer.CurrentCultureIgnoreCase);
            
            protected ResourceCollection(ResourceLoader loader, string pathPrefix = null)
            {
                _loader = loader;
                _pathPrefix = pathPrefix;
            }
            
            public object Load(string filePath)
            {
                var fullPath = filePath;
                
                object loaded;
                if (TryGetLoaded(filePath, out loaded)) return loaded;
                
                if (_pathPrefix != null)
                {
                    fullPath = $"{_pathPrefix}/{filePath}";
                    if (!_loader.ContainsFile(fullPath)) fullPath = filePath;
                }
                
                using (var stream = _loader.OpenFile(fullPath))
                {
                    loaded = OnLoad(stream);
                    _loaded.Add(filePath, loaded);
                }
                
                return loaded;
            }
            
            private bool TryGetLoaded(string filePath, out object resource)
            {
                return _loaded.TryGetValue(filePath, out resource);
            }
            
            protected abstract object OnLoad(Stream stream);
        }
        
        private class ResourceCollection<T> : ResourceCollection
        {
            private static string FindPathPrefix(Type type)
            {
                var attrib = type.GetCustomAttributes<PathPrefixAttribute>(false).FirstOrDefault();
                return attrib?.Value;
            }
            
            private static Func<Stream, T> FindFromStreamDelegate(Type type)
            {
                const BindingFlags bindingFlags = BindingFlags.Public | BindingFlags.Static;
                var types = new[] { typeof(Stream) };
                var method = type.GetMethod("FromStream", bindingFlags, null, types, null);
                
                if (method == null) throw new Exception($"Unable to find method {type.FullName}.FromStream({typeof(Stream).Name})");
                
                return (Func<Stream, T>) Delegate.CreateDelegate(typeof(Func<Stream, T>), null, method, true);
            }
            
            private readonly Func<Stream, T> _fromStreamDelegate;
            
            public ResourceCollection(ResourceLoader loader)
                : base(loader, FindPathPrefix(typeof(T)))
            {
                _fromStreamDelegate = FindFromStreamDelegate(typeof(T));
            }
            
            protected override object OnLoad(Stream stream)
            {
                return _fromStreamDelegate(stream);
            }
        }

        private readonly Dictionary<Type, ResourceCollection> _resourceCollections
            = new Dictionary<Type, ResourceCollection>();

        public T Load<T>(string filePath)
        {
            ResourceCollection collection;
            if (_resourceCollections.TryGetValue(typeof(T), out collection))
            {
                return (T) collection.Load(filePath);
            }
            
            collection = new ResourceCollection<T>(this);
            _resourceCollections.Add(typeof(T), collection);
            
            return (T) collection.Load(filePath);
        }
    }
}
