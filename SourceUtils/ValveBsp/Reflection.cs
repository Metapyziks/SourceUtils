using System;
using System.Reflection;

namespace SourceUtils
{
    [AttributeUsage(AttributeTargets.Struct)]
    public class StructVersionAttribute : Attribute
    {
        public int MinVersion { get; set; } = 0;
        public int MaxVersion { get; set; } = int.MaxValue;

        public StructVersionAttribute() { }

        public StructVersionAttribute( int minVersion, int maxVersion )
        {
            MinVersion = minVersion;
            MaxVersion = maxVersion;
        }
    }

    partial class ValveBspFile
    {
        [AttributeUsage(AttributeTargets.Property)]
        private class BspLumpAttribute : Attribute
        {
            public LumpType Type { get; set; }
            
            public BspLumpAttribute(LumpType type)
            {
                Type = type;
            }
        }
        
        private void InitializeLumps()
        {
            foreach (var prop in GetType().GetProperties() )
            {
                var attrib = prop.GetCustomAttribute<BspLumpAttribute>();
                if (attrib == null) continue;
                if (!typeof(ILump).IsAssignableFrom(prop.PropertyType)) continue;
                
                prop.SetValue(this, Activator.CreateInstance(prop.PropertyType, this, attrib.Type));
            }
        }
    }
}
