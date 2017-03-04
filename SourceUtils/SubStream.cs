using System;
using System.IO;

namespace SourceUtils
{
    public class SubStream : Stream
    {
        public Stream BaseStream { get; }

        public override bool CanRead => true;
        public override bool CanSeek => BaseStream.CanSeek;
        public override bool CanWrite => false;
        public override long Length { get; }

        public override long Position
        {
            get { return BaseStream.Position - _offset; }
            set { Seek( value, SeekOrigin.Begin ); }
        }

        private readonly long _offset;
        private readonly bool _ownsBaseStream;

        public SubStream( Stream baseStream, long offset, long length, bool ownsBaseStream )
        {
            BaseStream = baseStream;

            _offset = offset;
            Length = length;

            _ownsBaseStream = ownsBaseStream;
        }

        public override void Flush()
        {
            throw new NotImplementedException();
        }

        public override long Seek( long offset, SeekOrigin origin )
        {
            switch ( origin )
            {
                case SeekOrigin.Begin:
                    if ( offset < 0 || offset > Length ) throw new ArgumentOutOfRangeException();
                    return BaseStream.Seek( _offset + offset, SeekOrigin.Begin ) - _offset;
                case SeekOrigin.Current:
                    var curPos = Position;
                    if ( curPos < 0 || curPos > Length ) throw new InvalidOperationException();
                    if ( curPos + offset < 0 || curPos + offset > Length ) throw new ArgumentOutOfRangeException();
                    return BaseStream.Seek( offset, SeekOrigin.Current ) - _offset;
                case SeekOrigin.End:
                    if ( offset > 0 || offset < -Length ) throw new ArgumentOutOfRangeException();
                    return BaseStream.Seek( _offset + Length + offset, SeekOrigin.Begin ) - _offset;
                default:
                    return BaseStream.Seek( offset, origin );
            }
        }

        public override void SetLength( long value )
        {
            throw new NotImplementedException();
        }

        public override int Read( byte[] buffer, int offset, int count )
        {
            var curPos = Position;
            if ( curPos < 0 || curPos > Length ) throw new InvalidOperationException();

            count = Math.Min( count, (int) (Length - curPos) );
            return BaseStream.Read( buffer, offset, count );
        }

        public override void Write( byte[] buffer, int offset, int count )
        {
            throw new NotImplementedException();
        }

        protected override void Dispose( bool disposing )
        {
            base.Dispose( disposing );

            if ( _ownsBaseStream && disposing ) BaseStream.Dispose();
        }
    }
}
