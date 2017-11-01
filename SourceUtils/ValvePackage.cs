using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace SourceUtils
{
    public class ValvePackage : IResourceProvider
    {
        private class VpkStream : Stream
        {
            private readonly ValvePackage _archive;
            private readonly int _archiveIndex;
            private readonly Stream _baseStream;
            private readonly long _fileOffset;
            private readonly long _fileLength;
            private readonly int _preloadBytesLength;
            private readonly byte[] _preloadBytes;
            private long _position;

            private bool _disposed;

            public VpkStream(ValvePackage archive, int archiveIndex, long offset, long length, byte[] preloadBytes)
            {
                _archive = archive;
                _archiveIndex = archiveIndex;
                _baseStream = archiveIndex < 32767 ? archive.OpenArchive(archiveIndex) : null;

                _preloadBytesLength = preloadBytes?.Length ?? 0;
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

        public ValvePackage(string dirFilePath)
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

        [ThreadStatic]
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

        // Extension -> Directory -> File Name
        private readonly Dictionary<string, Dictionary<string, Dictionary<string, DirectoryEntry>>> _fileDict
            = new Dictionary<string, Dictionary<string, Dictionary<string, DirectoryEntry>>>(StringComparer.InvariantCultureIgnoreCase);

        private class VpkDirectory
        {
            private readonly Dictionary<string, VpkDirectory> _directories
                = new Dictionary<string, VpkDirectory>(StringComparer.InvariantCultureIgnoreCase);
            private readonly HashSet<string> _files = new HashSet<string>();
            
            public IEnumerable<string> DirectoryNames => _directories.Keys;
            public IEnumerable<string> FileNames => _files;
            
            private static int GetSubdirEndIndex(string path)
            {
                return path.IndexOf('/');
            }
            
            public VpkDirectory GetDirectory(string directory)
            {
                if (directory.Length == 0) return this;
                
                var sepIndex = GetSubdirEndIndex(directory);
                if (sepIndex == -1) sepIndex = directory.Length;
                
                var dirName = directory.Substring(0, sepIndex);
                VpkDirectory subDirectory;
                if (!_directories.TryGetValue(dirName, out subDirectory)) return null;
                if (sepIndex + 1 >= directory.Length) return subDirectory;
                
                return subDirectory.GetDirectory(directory.Substring(sepIndex + 1));
            }
            
            public void AddFile(string fullPath)
            {
                var sepIndex = GetSubdirEndIndex(fullPath);
                if (sepIndex == -1)
                {
                    _files.Add(fullPath);
                    return;
                }
                
                var dirName = fullPath.Substring(0, sepIndex).Trim();
                if (dirName.Length == 0)
                {
                    _files.Add(fullPath.Substring(sepIndex + 1));
                    return;
                }
                
                VpkDirectory subDirectory;
                if (!_directories.TryGetValue(dirName, out subDirectory))
                {
                    subDirectory = new VpkDirectory();
                    _directories.Add(dirName, subDirectory);
                }
                
                subDirectory.AddFile(fullPath.Substring(sepIndex + 1));
            }
        }
        
        private readonly VpkDirectory _rootDirectory = new VpkDirectory();

        public IEnumerable<string> GetFiles(string directory = "")
        {
            return _rootDirectory.GetDirectory(directory)?.FileNames ?? Enumerable.Empty<string>();
        }
        
        public IEnumerable<string> GetDirectories(string directory = "")
        {
            return _rootDirectory.GetDirectory(directory)?.DirectoryNames ?? Enumerable.Empty<string>();
        }

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
                            _rootDirectory.AddFile(string.IsNullOrWhiteSpace(path) 
                                ? $"{name}.{ext}" : $"{path}/{name}.{ext}");
                        }
                    }
                }
            }
        }

        private string GetArchiveFileName(int index)
        {
            return string.Format(_archiveFileNameFormat, index);
        }

        private class ArchiveInfo : DisposingEventTarget<ArchiveInfo>
        {
            [ThreadStatic]
            private static Dictionary<ArchiveInfo, Stream> _sStreams;

            public int Accessors;
            private readonly string _fileName;

            public ArchiveInfo( string fileName )
            {
                _fileName = fileName;
                Accessors = 0;
            }

            public Stream GetStream()
            {
                var streams = _sStreams ?? (_sStreams = new Dictionary<ArchiveInfo, Stream>());

                Stream stream;
                if ( streams.TryGetValue( this, out stream ) ) return stream;

                stream = File.Open( _fileName, FileMode.Open, FileAccess.Read, FileShare.Read );
                streams.Add( this, stream );

                Disposing += _ =>
                {
                    streams.Remove( this );
                    stream.Dispose();
                };

                return stream;
            }
        }

        private readonly Dictionary<int, ArchiveInfo> _openArchives = new Dictionary<int, ArchiveInfo>();

        private Stream OpenArchive(int index)
        {
            lock ( this )
            {
                ArchiveInfo info;
                if ( !_openArchives.TryGetValue( index, out info ) )
                {
                    var fileName = GetArchiveFileName( index );
                    info = new ArchiveInfo( fileName );
                    _openArchives.Add( index, info );
                }

                info.Accessors += 1;
                return info.GetStream();
            }
        }

        private void CloseArchive(int index)
        {
            lock ( this )
            {
                ArchiveInfo info;
                if ( !_openArchives.TryGetValue( index, out info ) ) throw new InvalidOperationException();

                info.Accessors -= 1;

                if ( info.Accessors <= 0 )
                {
                    _openArchives.Remove( index );
                    info.Dispose();
                }
            }
        }

        private bool SplitFileName(string fileName, out string ext, out string path, out string name)
        {
            ext = path = name = null;
            
            var dirSep = fileName.LastIndexOf('/');
            var extSep = fileName.LastIndexOf('.');
            
            if (extSep == -1) return false;

            ext = fileName.Substring(extSep + 1);
            path = dirSep == -1 ? "" : fileName.Substring(0, dirSep);
            name = fileName.Substring(dirSep + 1, extSep - dirSep - 1);
            
            return true;
        }

        public bool ContainsFile(string filePath)
        {
            string ext, path, name;
            if (!SplitFileName(filePath, out ext, out path, out name)) return false;

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

        private static Exception FileNotFound(string filePath)
        {
            throw new FileNotFoundException( $"Cound not find file '{filePath}' in VPK archive.", filePath);
        }

        public Stream OpenFile(string filePath)
        {
            string ext, path, name;
            SplitFileName(filePath, out ext, out path, out name);

            Dictionary<string, Dictionary<string, DirectoryEntry>> extDict;
            if (!_fileDict.TryGetValue(ext, out extDict)) throw FileNotFound(filePath);

            DirectoryEntry entry = default (DirectoryEntry);
            if (!string.IsNullOrEmpty(path))
            {
                Dictionary<string, DirectoryEntry> dirDict;
                if (!extDict.TryGetValue(path, out dirDict)) throw FileNotFound(filePath);

                if (!dirDict.TryGetValue(name, out entry)) throw FileNotFound(filePath);
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

                if (!found) throw FileNotFound(filePath);
            }

            return new VpkStream(this, entry.ArchiveIndex, entry.EntryOffset, entry.EntryLength, entry.PreloadData);
        }
    }
}