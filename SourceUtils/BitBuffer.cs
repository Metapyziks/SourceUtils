using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace SourceUtils
{
    public enum BitCoordType
    {
        None,
        LowPrecision,
        Integral
    };

    public class BitBuffer
    {
        private static int ZigZagDecode32(uint n)
        {
            return (int) (n >> 1) ^ -unchecked((int)(n & 1));
        }

        private static long ZigZagDecode64(ulong n)
        {
            return (long) (n >> 1) ^ -unchecked((long) (n & 1));
        }

        private static readonly uint[] _sMaskTable = {
            0,
            ( 1 << 1 ) - 1,
            ( 1 << 2 ) - 1,
            ( 1 << 3 ) - 1,
            ( 1 << 4 ) - 1,
            ( 1 << 5 ) - 1,
            ( 1 << 6 ) - 1,
            ( 1 << 7 ) - 1,
            ( 1 << 8 ) - 1,
            ( 1 << 9 ) - 1,
            ( 1 << 10 ) - 1,
            ( 1 << 11 ) - 1,
            ( 1 << 12 ) - 1,
            ( 1 << 13 ) - 1,
            ( 1 << 14 ) - 1,
            ( 1 << 15 ) - 1,
            ( 1 << 16 ) - 1,
            ( 1 << 17 ) - 1,
            ( 1 << 18 ) - 1,
            ( 1 << 19 ) - 1,
            ( 1 << 20 ) - 1,
            ( 1 << 21 ) - 1,
            ( 1 << 22 ) - 1,
            ( 1 << 23 ) - 1,
            ( 1 << 24 ) - 1,
            ( 1 << 25 ) - 1,
            ( 1 << 26 ) - 1,
            ( 1 << 27 ) - 1,
            ( 1 << 28 ) - 1,
            ( 1 << 29 ) - 1,
            ( 1 << 30 ) - 1,
            0x7fffffff,
            0xffffffff
        };

        private readonly byte[] _buffer;
        private int _readOffset;
        private int _bitsAvailable;
        private int _totalBits;
        private uint _bufferDWord;
        private bool _overflow;

        public BitBuffer(byte[] buffer, int length = -1)
        {
            _buffer = buffer;
            _readOffset = 0;
            _bitsAvailable = 0;
            _totalBits = (length == -1 ? buffer.Length : length) << 3;

            Seek(0);
        }

        public bool Seek(int position)
        {
            var success = true;
            if (position < 0 || position > _totalBits)
            {
                SetOverflowFlag();
                success = false;
                position = _totalBits;
            }

            var head = _buffer.Length & 3;
            var byteOffset = position >> 3;
            if ((_buffer.Length < 4) || (head != 0 && byteOffset < head))
            {
                _bufferDWord = _buffer[_readOffset++];
                if (head > 1) _bufferDWord |= (uint) _buffer[_readOffset++] << 8;
                if (head > 2) _bufferDWord |= (uint) _buffer[_readOffset++] << 16;
                _bufferDWord >>= (position & 31);
                _bitsAvailable = (head << 3) - (position & 31);
            }
            else
            {
                var adjPosition = position - (head << 3);
                _readOffset = ((adjPosition >> 5) << 2) + head;
                _bitsAvailable = 32;
                GrabNextDWord();
                _bufferDWord >>= adjPosition & 31;
                _bitsAvailable = Math.Min(_bitsAvailable, 32 - (adjPosition & 31));
            }

            return success;
        }

        private void FetchNext()
        {
            _bitsAvailable = 32;
            GrabNextDWord();
        }

        private void SetOverflowFlag()
        {
            _overflow = true;
        }

        private void GrabNextDWord(bool overflowImmediately = false)
        {
            if (_readOffset == _buffer.Length)
            {
                _bitsAvailable = 1;
                _bufferDWord = 0;
                _readOffset += sizeof(uint);

                if (overflowImmediately) SetOverflowFlag();

                return;
            }

            if (_readOffset > _buffer.Length)
            {
                SetOverflowFlag();
                _bufferDWord = 0;

                return;
            }

            Debug.Assert(_readOffset + sizeof(uint) <= _buffer.Length);
            _bufferDWord = BitConverter.ToUInt32(_buffer, _readOffset);
            _readOffset += sizeof (uint);
        }

        public uint ReadUBitLong(int bits)
        {
            if (_bitsAvailable >= bits)
            {
                var ret = _bufferDWord & _sMaskTable[bits];
                _bitsAvailable -= bits;

                if (_bitsAvailable > 0) _bufferDWord >>= bits;
                else FetchNext();

                return ret;
            }
            else
            {
                var ret = _bufferDWord;
                bits -= _bitsAvailable;

                GrabNextDWord(true);
                if (_overflow) return 0;

                ret |= ((_bufferDWord & _sMaskTable[bits]) << _bitsAvailable);
                _bitsAvailable = 32 - bits;
                _bufferDWord >>= bits;

                return ret;
            }
        }

        public int ReadSBitLong(int bits)
        {
            var ret = (int) ReadUBitLong(bits);
            return (ret << (32 - bits)) >> (32 - bits);
        }

        public uint ReadUBitVar()
        {
            var ret = ReadUBitLong(6);

            switch (ret & (16 | 32))
            {
                case 16:
                    ret = (ret & 15) | (ReadUBitLong(4) << 4);
                    Debug.Assert(ret >= 16);
                    break;
                case 32:
                    ret = (ret & 15) | (ReadUBitLong(8) << 4);
                    Debug.Assert(ret >= 256);
                    break;
                case 48:
                    ret = (ret & 15) | (ReadUBitLong(32 - 4) << 4);
                    Debug.Assert(ret >= 4096);
                    break;
            }

            return ret;
        }

        public uint ReadVarInt32()
        {
            uint result = 0;
            int count = 0;
            uint b;

            do
            {
                if (count == 5)
                {
                    return result;
                }
                b = ReadUBitLong(8);
                result |= (b & 0x7F) << (7 * count);
                ++count;
            } while ((b & 0x80) != 0);

            return result;
        }

        public int ReadSignedVarInt32()
        {
            return ZigZagDecode32(ReadVarInt32());
        }

        public ulong ReadVarInt64()
        {
            ulong result = 0;
            int count = 0;
            ulong b;

            do
            {
                if (count == 10)
                {
                    return result;
                }
                b = ReadUBitLong(8);
                result |= (b & 0x7F) << (7 * count);
                ++count;
            } while ((b & 0x80) != 0);

            return result;
        }

        public long ReadSignedVarInt64()
        {
            return ZigZagDecode64(ReadVarInt64());
        }

        const int CoordIntegerBits = 14;
        private const int CoordIntegerBitsMP = 11;
        const int CoordFractionalBits = 5;
        const int CoordFractionalBitsLowPrecision = 3;
        const int CoordDenominator = 1 << CoordFractionalBits;
        const int CoordDenominatorLowPrecision = 1 << CoordFractionalBitsLowPrecision;
        const float CoordResolution = 1f/CoordDenominator;
        const float CoordResolutionLowPrecision = 1f/CoordDenominatorLowPrecision;

        public float ReadBitCoord()
        {
            var hasInt = ReadOneBit();
            var hasFract = ReadOneBit();
            
            if (!hasInt && !hasFract) return 0f;

            var sign = ReadOneBit() ? -1 : 1;

            var intVal = 0;
            var fractVal = 0;

            if (hasInt) intVal = (int) ReadUBitLong(CoordIntegerBits) + 1;
            if (hasFract) fractVal = (int) ReadUBitLong(CoordFractionalBits);

            return sign * (intVal + fractVal* CoordResolution);
        }

        public float ReadBitCoordMP(BitCoordType coordType)
        {
            int sign;

            var integral = coordType == BitCoordType.Integral;
            var lowPrec = coordType == BitCoordType.LowPrecision;

            var inBounds = ReadOneBit();

            if (integral)
            {
                if (!ReadOneBit()) return 0f;

                sign = ReadOneBit() ? -1 : 1;
                return sign * ReadUBitLong(inBounds ? CoordIntegerBitsMP : CoordIntegerBits) + 1f;
            }

            var hasInt = ReadOneBit();
            sign = ReadOneBit() ? -1 : 1;

            var intVal = 0;

            if (hasInt)
            {
                intVal = (int) ReadUBitLong(inBounds ? CoordIntegerBitsMP : CoordIntegerBits) + 1;
            }

            var fractVal = ReadUBitLong(lowPrec ? CoordFractionalBitsLowPrecision : CoordFractionalBits);

            return sign*(intVal + fractVal*(lowPrec ? CoordResolutionLowPrecision : CoordResolution));
        }

        [StructLayout(LayoutKind.Explicit)]
        private struct FloatIntUnion
        {
            [FieldOffset(0)]
            public uint Uint32Val;

            [FieldOffset(0)]
            public float FloatVal;
        }

        public float ReadBitFloat()
        {
            var union = default(FloatIntUnion);
            union.Uint32Val = ReadUBitLong(32);
            return union.FloatVal;
        }

        public float ReadBitNormal()
        {
            const int normalFractionalBits = 11;
            const int normalDenominator = (1 << normalFractionalBits) - 1;
            const float normalResolution = 1f/normalDenominator;

            var sign = ReadOneBit() ? -1 : 1;
            var fractVal = ReadUBitLong(normalFractionalBits);
            return sign*fractVal*normalResolution;
        }

        public float ReadBitCellCoord(int bits, BitCoordType coordType)
        {
            var integral = coordType == BitCoordType.Integral;
            var lowPrec = coordType == BitCoordType.LowPrecision;

            if (integral) return ReadUBitLong(bits);

            var intVal = ReadUBitLong(bits);
            var fractVal = ReadUBitLong(lowPrec ? CoordFractionalBitsLowPrecision : CoordFractionalBits);
            return intVal + (fractVal*(lowPrec ? CoordResolutionLowPrecision : CoordResolution));
        }

        public void ReadBits(byte[] buffer, int bits)
        {
            var index = 0;
            var bitsLeft = bits;

            while (bitsLeft >= 8)
            {
                buffer[index++] = (byte) ReadUBitLong(8);
                bitsLeft -= 8;
            }

            if (bitsLeft > 0)
            {
                buffer[index] = (byte) ReadUBitLong(bitsLeft);
            }
        }

        public bool ReadBytes(byte[] buffer, int bytes)
        {
            ReadBits(buffer, bytes << 3);
            return !_overflow;
        }

        public bool ReadOneBit()
        {
            var ret = (_bufferDWord & 1) == 1;
            if (--_bitsAvailable == 0) FetchNext();
            else _bufferDWord >>= 1;

            return ret;
        }

        public char ReadChar()
        {
            return (char) ReadSBitLong(sizeof (byte) << 3);
        }

        public byte ReadByte()
        {
            return (byte) ReadUBitLong(sizeof(byte) << 3);
        }

        public ushort ReadWord()
        {
            return (ushort) ReadUBitLong(sizeof(ushort) << 3);
        }

        [ThreadStatic]
        private static StringBuilder _sStringBuilder;

        public string ReadString(int maxLength, bool line = false)
        {
            if (_sStringBuilder == null) _sStringBuilder = new StringBuilder(maxLength);
            else _sStringBuilder.Remove(0, _sStringBuilder.Length);

            var tooSmall = false;
            var index = 0;
            while (true)
            {
                char val = ReadChar();
                if (val == 0 || line && val == '\n') break;

                if (index < maxLength - 1)
                {
                    _sStringBuilder.Append(val);
                }
                else
                {
                    tooSmall = true;
                }
            }

            return !_overflow && !tooSmall ? _sStringBuilder.ToString() : null;
        }
    }
}