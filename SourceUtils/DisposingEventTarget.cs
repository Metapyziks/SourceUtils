using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils
{
    public class DisposingEventTarget<T> : IDisposable
        where T : DisposingEventTarget<T>
    {
        private readonly List<Action<T>> _disposingHandlers
            = new List<Action<T>>();

        public event Action<T> Disposing
        {
            add
            {
                lock ( _disposingHandlers )
                {
                    _disposingHandlers.Add( value );
                }
            }
            remove
            {
                lock ( _disposingHandlers )
                {
                    _disposingHandlers.Remove( value );
                }
            }
        }

        public void Dispose()
        {
            lock ( _disposingHandlers )
            {
                foreach ( var disposingHandler in _disposingHandlers )
                {
                    disposingHandler( (T) this );
                }

                _disposingHandlers.Clear();
            }

            OnDispose();
        }

        protected virtual void OnDispose()
        {
            
        }
    }
}
