using System.Collections.Generic;

namespace SourceUtils.ValveBsp
{
    public class DisplacementManager
    {
        private readonly ValveBspFile _bsp;
        private readonly Dictionary<int, Displacement> _displacements = new Dictionary<int, Displacement>();

        internal DisplacementManager( ValveBspFile bsp )
        {
            _bsp = bsp;
        }

        public Displacement this[ int index ]
        {
            get
            {
                lock ( this )
                {
                    Displacement existing;
                    if ( _displacements.TryGetValue( index, out existing ) ) return existing;

                    existing = new Displacement( _bsp, index );
                    _displacements.Add( index, existing );
                    return existing;
                }
            }
        }
    }
}
