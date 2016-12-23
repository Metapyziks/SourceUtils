using System;
using System.Collections.Generic;
using System.Reflection;

namespace SourceUtils
{
    partial class ValveBspFile
    {
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
