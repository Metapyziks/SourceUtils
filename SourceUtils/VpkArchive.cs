using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace SourceUtils
{
    public class VpkArchve : IResourceProvider
    {
        private class VpkStream : Stream
        {
            private readonly VpkArchve _archive;
            private readonly int _archiveIndex;
            private readonly Stream _baseStream;
            private readonly long _fileOffset;
            private readonly long _fileLength;
            private readonly int _preloadBytesLength;
            private readonly byte[] _preloadBytes;
            private long _position;

            private bool _disposed;

            public VpkStream(VpkArchve archive, int archiveIndex, long offset, long length, byte[] preloadBytes)
            {
                _archive = archive;
                _archiveIndex = archiveIndex;
                _baseStream = archiveIndex < 32767 ? archive.OpenArchive(archiveIndex) : null;

                _preloadBytesLength = preloadBytes == null ? 0 : preloadBytes.Length;
                _preloadBytes = preloadBytes;

                _fileOffset = offset;
                _fileLength = length + _preloadBytesLength;
            }

            public override void Flush() { }

            public override int Read(byte[] buffer, int offset, int count)
            {
                var preloadRead = 0;
                var read = 0;

                if (_position < _preloadBytesLength && count > 0)
                {
                    var preloadEnd = Math.Min(_position + count, _preloadBytesLength);
                    preloadRead = (int) (preloadEnd - _position);

                    Array.Copy(_preloadBytes, _position, buffer, offset, preloadRead);

                    offset += preloadRead;
                    count -= preloadRead;

                    _position = preloadEnd;
                }

                if (count > 0 && _baseStream != null)
                {
                    var end = Math.Min(_position + count, _fileLength);

                    _baseStream.Position = _fileOffset + _position - _preloadBytesLength;
                    read = _baseStream.Read(buffer, offset, (int) (end - _position));

                    _position += read;
                }

                return preloadRead + read;
            }

            public override long Seek(long offset, SeekOrigin origin)
            {
                switch (origin)
                {
                    case SeekOrigin.Begin:
                        return _position = offset;
                    case SeekOrigin.Current:
                        return _position += offset;
                    case SeekOrigin.End:
                        return _position = _fileLength + offset;
                    default:
                        throw new ArgumentException();
                }
            }

            public override void SetLength(long value)
            {
                throw new NotImplementedException();
            }

            public override void Write(byte[] buffer, int offset, int count)
            {
                throw new NotImplementedException();
            }

            public override bool CanRead
            {
                get { return true; }
            }

            public override bool CanSeek
            {
                get { return true; }
            }

            public override bool CanWrite
            {
                get { return false; }
            }

            public override long Length
            {
                get { return _fileLength; }
            }

            public override long Position
            {
                get { return _position; }
                set
                {
                    if (value < 0 || value > _fileLength) throw new ArgumentOutOfRangeException();
                    _position = value;
                }
            }

            protected override void Dispose(bool disposing)
            {
                if (_disposed) return;

                if (disposing)
                {
                    _disposed = true;
                    if (_baseStream != null) _archive.CloseArchive(_archiveIndex);
                }
            }
        }

        private readonly string _archiveFileNameFormat;

        public VpkArchve(string dirFilePath)
        {
            const string fileExtension = ".vpk";
            const string dirPostfix = "_dir" + fileExtension;

            if (!dirFilePath.EndsWith(dirPostfix)) throw new ArgumentException();

            _archiveFileNameFormat = dirFilePath.Substring(0, dirFilePath.Length - dirPostfix.Length) + "_{0:000}.vpk";

            using (var stream = File.Open(dirFilePath, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                ReadDirectory(stream);
            }
        }

        private static StringBuilder _sBuilder;
        private static string ReadNullTerminatedString(BinaryReader reader)
        {
            if (_sBuilder == null) _sBuilder = new StringBuilder();
            else _sBuilder.Remove(0, _sBuilder.Length);

            while (true)
            {
                var c = reader.ReadChar();
                if (c == 0) return _sBuilder.ToString();
                _sBuilder.Append(c);
            }
        }

        private struct DirectoryEntry
        {
            public readonly uint Crc;
            public readonly ushort PreloadBytes;

            public readonly ushort ArchiveIndex;
            public readonly uint EntryOffset;
            public readonly uint EntryLength;

            public readonly ushort Terminator;

            public readonly byte[] PreloadData;

            public DirectoryEntry(BinaryReader reader)
            {
                Crc = reader.ReadUInt32();
                PreloadBytes = reader.ReadUInt16();
                ArchiveIndex = reader.ReadUInt16();
                EntryOffset = reader.ReadUInt32();
                EntryLength = reader.ReadUInt32();
                Terminator = reader.ReadUInt16();

                if (Terminator != 0xffff)
                {
                    throw new Exception("Directory entry reading is misaligned");
                }

                PreloadData = PreloadBytes != 0 ? reader.ReadBytes(PreloadBytes) : null;
            }
        }

        private readonly Dictionary<string, Dictionary<string, Dictionary<string, DirectoryEntry>>> _fileDict
            = new Dictionary<string, Dictionary<string, Dictionary<string, DirectoryEntry>>>(StringComparer.InvariantCultureIgnoreCase);

        private void ReadDirectory(Stream stream)
        {
            var reader = new BinaryReader(stream);

            var sig = reader.ReadUInt32();
            var ver = reader.ReadUInt32();

            if (sig != 0x55aa1234) throw new Exception("Invalid header signature");
            if (ver != 2) throw new Exception("Unsupported VPK directory version");

            var treeSize = reader.ReadUInt32();
            var fileDataSectionSize = reader.ReadUInt32();
            var archiveMd5SectionSize = reader.ReadUInt32();
            var otherMd5SectionSize = reader.ReadUInt32();
            var signatureSecionSize = reader.ReadUInt32();

            while (true)
            {
                var ext = ReadNullTerminatedString(reader);
                if (ext.Length == 0) break;

                Dictionary<string, Dictionary<string, DirectoryEntry>> extDict;
                if (!_fileDict.TryGetValue(ext, out extDict))
                {
                    extDict = new Dictionary<string, Dictionary<string, DirectoryEntry>>(StringComparer.InvariantCultureIgnoreCase);
                    _fileDict.Add(ext, extDict);
                }

                while (true)
                {
                    var path = ReadNullTerminatedString(reader);
                    if (path.Length == 0) break;

                    Dictionary<string, DirectoryEntry> dirDict;
                    if (!extDict.TryGetValue(path, out dirDict))
                    {
                        dirDict = new Dictionary<string, DirectoryEntry>(StringComparer.InvariantCultureIgnoreCase);
                        extDict.Add(path, dirDict);
                    }

                    while (true)
                    {
                        var name = ReadNullTerminatedString(reader);
                        if (name.Length == 0) break;

                        var entry = new DirectoryEntry(reader);

                        if (dirDict.ContainsKey(name))
                        {
                            dirDict[name] = entry;
                        }
                        else
                        {
                            dirDict.Add(name, entry);
                        }
                    }
                }
            }
        }

        private string GetArchiveFileName(int index)
        {
            return string.Format(_archiveFileNameFormat, index);
        }

        private class ArchiveInfo
        {
            public int Accessors;
            public readonly Stream Stream;

            public ArchiveInfo(Stream stream)
            {
                Stream = stream;
                Accessors = 0;
            }
        }

        private readonly Dictionary<int, ArchiveInfo> _openArchives = new Dictionary<int, ArchiveInfo>();

        private Stream OpenArchive(int index)
        {
            ArchiveInfo info;
            if (!_openArchives.TryGetValue(index, out info))
            {
                var fileName = GetArchiveFileName(index);
                info = new ArchiveInfo(File.Open(fileName, FileMode.Open, FileAccess.Read, FileShare.Read));
                _openArchives.Add(index, info);
            }

            info.Accessors += 1;
            return info.Stream;
        }

        private void CloseArchive(int index)
        {
            ArchiveInfo info;
            if (!_openArchives.TryGetValue(index, out info)) throw new InvalidOperationException();

            info.Accessors -= 1;

            if (info.Accessors <= 0)
            {
                _openArchives.Remove(index);
                info.Stream.Dispose();
            }
        }

        private void SplitFileName(string fileName, out string ext, out string path, out string name)
        {
            var dirSep = fileName.LastIndexOf('/');
            var extSep = fileName.LastIndexOf('.');

            ext = fileName.Substring(extSep + 1);
            path = dirSep == -1 ? "" : fileName.Substring(0, dirSep);
            name = fileName.Substring(dirSep + 1, extSep - dirSep - 1);
        }

        public bool ContainsFile(string fileName)
        {
            string ext, path, name;
            SplitFileName(fileName, out ext, out path, out name);

            Dictionary<string, Dictionary<string, DirectoryEntry>> extDict;
            if (!_fileDict.TryGetValue(ext, out extDict)) return false;

            if (!string.IsNullOrEmpty(path))
            {
                Dictionary<string, DirectoryEntry> dirDict;
                if (!extDict.TryGetValue(path, out dirDict)) return false;

                return dirDict.ContainsKey(name);
            }

            return extDict.Values.Any(x => x.ContainsKey(name));
        }

        private static Exception FileNotFound(string fileName)
        {
            throw new FileNotFoundException(string.Format("Cound not find file '{0}' in VPK archive.", fileName), fileName);
        }

        public Stream OpenFile(string fileName)
        {
            string ext, path, name;
            SplitFileName(fileName, out ext, out path, out name);

            Dictionary<string, Dictionary<string, DirectoryEntry>> extDict;
            if (!_fileDict.TryGetValue(ext, out extDict)) throw FileNotFound(fileName);

            DirectoryEntry entry = default (DirectoryEntry);
            if (!string.IsNullOrEmpty(path))
            {
                Dictionary<string, DirectoryEntry> dirDict;
                if (!extDict.TryGetValue(path, out dirDict)) throw FileNotFound(fileName);

                if (!dirDict.TryGetValue(name, out entry)) throw FileNotFound(fileName);
            }
            else
            {
                var found = false;
                foreach (var dirDict in extDict.Values)
                {
                    if (!dirDict.TryGetValue(name, out entry)) continue;
                    found = true;
                    break;
                }

                if (!found) throw FileNotFound(fileName);
            }

            return new VpkStream(this, entry.ArchiveIndex, entry.EntryOffset, entry.EntryLength, entry.PreloadData);
        }
    }
}