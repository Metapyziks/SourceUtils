using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.WebExport
{
    /// <summary>
     /// https://github.com/kreudom/lz-string-csharp
     /// </summary>
    public class LZString
    {
        static string keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        static string keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
        static Dictionary<string, Dictionary<char, int>> baseReverseDic = new Dictionary<string, Dictionary<char, int>>();
        private delegate char GetCharFromInt(int a);
        private static GetCharFromInt f = (a) => Convert.ToChar(a);
        private delegate int GetNextValue(int index);

        private static int getBaseValue(string alphabet, char character)
        {
            if (!baseReverseDic.ContainsKey(alphabet))
            {
                baseReverseDic[alphabet] = new Dictionary<char, int>();
                for (int i = 0; i < alphabet.Length; i++)
                {
                    baseReverseDic[alphabet][alphabet[i]] = i;
                }
            }
            return baseReverseDic[alphabet][character];
        }

        public static string compressToBase64(string input)
        {
            if (input == null) return "";
            string res = _compress(input, 6, (a) => keyStrBase64[a]);
            switch (res.Length % 4)
            {
                case 0: return res;
                case 1: return res + "===";
                case 2: return res + "==";
                case 3: return res + "=";
            }
            return null;
        }

        public static string decompressFromBase64(string input)
        {
            if (input == null) return "";
            if (input == "") return null;
            return _decompress(input.Length, 32, (index) => getBaseValue(keyStrBase64, input[index]));
        }

        public static string compressToUTF16(string input)
        {
            if (input == null) return "";
            return _compress(input, 15, (a) => f(a + 32)) + " ";
        }

        public static string decompressFromUTF16(string compressed)
        {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return _decompress(compressed.Length, 16384, index => Convert.ToInt32(compressed[index]) - 32);
        }

        public static byte[] compressToUint8Array(string uncompressed)
        {
            string compressed = compress(uncompressed);
            byte[] buf = new byte[compressed.Length * 2];

            for (int i = 0, TotalLen = compressed.Length; i < TotalLen; i++)
            {
                int current_value = Convert.ToInt32(compressed[i]);
                buf[i * 2] = (byte)(((uint)current_value) >> 8);
                buf[i * 2 + 1] = (byte)(current_value % 256);
            }
            return buf;
        }

        public static string decompressFromUint8Array(byte[] compressed)
        {
            if (compressed == null) return "";
            else
            {
                int[] buf = new int[compressed.Length / 2];
                for (int i = 0, TotalLen = buf.Length; i < TotalLen; i++)
                {
                    buf[i] = ((int)compressed[i * 2]) * 256 + ((int)compressed[i * 2 + 1]);
                }
                char[] result = new char[buf.Length];
                for (int i = 0; i < buf.Length; i++)
                {
                    result[i] = f(buf[i]);
                }
                return decompress(new string(result));
            }
        }

        public static string compressToEncodedURIComponent(string input)
        {
            if (input == null) return "";
            return _compress(input, 6, (a) => keyStrUriSafe[a]);
        }

        public static string decompressFromEncodedURIComponent(string input)
        {
            if (input == null) return "";
            if (input == "") return null;
            input = input.Replace(' ', '+');
            return _decompress(input.Length, 32, (index) => getBaseValue(keyStrUriSafe, input[index]));
        }

        public static string compress(string uncompressed)
        {
            return _compress(uncompressed, 16, f);
        }

        private static string _compress(string uncompressed, int bitsPerChar, GetCharFromInt getCharFromInt)
        {
            if (uncompressed == null) return "";
            int i, value, ii, context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data_val = 0, context_data_position = 0;
            Dictionary<string, bool> context_dictionaryToCreate = new Dictionary<string, bool>();
            Dictionary<string, int> context_dictionary = new Dictionary<string, int>();
            StringBuilder context_data = new StringBuilder();
            string context_c = "";
            string context_wc = "", context_w = "";

            for (ii = 0; ii < uncompressed.Length; ii++)
            {
                context_c = uncompressed[ii].ToString();
                if (!context_dictionary.ContainsKey(context_c))
                {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }
                context_wc = context_w + context_c;
                if (context_dictionary.ContainsKey(context_wc))
                {
                    context_w = context_wc;
                }
                else
                {
                    if (context_dictionaryToCreate.ContainsKey(context_w))
                    {
                        if (Convert.ToInt32(context_w[0]) < 256)
                        {
                            for (i = 0; i < context_numBits; i++)
                            {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1)
                                {
                                    context_data_position = 0;
                                    context_data.Append(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else
                                {
                                    context_data_position++;
                                }
                            }
                            value = Convert.ToInt32(context_w[0]);
                            for (i = 0; i < 8; i++)
                            {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1)
                                {
                                    context_data_position = 0;
                                    context_data.Append(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else
                                {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        else
                        {
                            value = 1;
                            for (i = 0; i < context_numBits; i++)
                            {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1)
                                {
                                    context_data_position = 0;
                                    context_data.Append(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else
                                {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = Convert.ToInt32(context_w[0]);
                            for (i = 0; i < 16; i++)
                            {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1)
                                {
                                    context_data_position = 0;
                                    context_data.Append(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else
                                {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0)
                        {
                            context_enlargeIn = (int)Math.Pow(2, context_numBits);
                            context_numBits++;
                        }
                        context_dictionaryToCreate.Remove(context_w);
                    }
                    else
                    {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++)
                        {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.Append(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0)
                    {
                        context_enlargeIn = (int)Math.Pow(2, context_numBits);
                        context_numBits++;
                    }
                    //Add wc to the dictionary
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = context_c;
                }
            }
            //Output the code for w
            if (context_w != "")
            {
                if (context_dictionaryToCreate.ContainsKey(context_w))
                {
                    if (Convert.ToInt32(context_w[0]) < 256)
                    {
                        for (i = 0; i < context_numBits; i++)
                        {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.Append(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                        }
                        value = Convert.ToInt32(context_w[0]);
                        for (i = 0; i < 8; i++)
                        {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.Append(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    else
                    {
                        value = 1;
                        for (i = 0; i < context_numBits; i++)
                        {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.Append(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = Convert.ToInt32(context_w[0]);
                        for (i = 0; i < 16; i++)
                        {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.Append(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0)
                    {
                        context_enlargeIn = (int)Math.Pow(2, context_numBits);
                        context_numBits++;
                    }
                    context_dictionaryToCreate.Remove(context_w);
                }
                else
                {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++)
                    {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1)
                        {
                            context_data_position = 0;
                            context_data.Append(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        }
                        else
                        {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0)
                {
                    context_enlargeIn = (int)Math.Pow(2, context_numBits);
                    context_numBits++;
                }
            }
            //Mark the end of the stream
            value = 2;
            for (i = 0; i < context_numBits; i++)
            {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1)
                {
                    context_data_position = 0;
                    context_data.Append(getCharFromInt(context_data_val));
                    context_data_val = 0;
                }
                else
                {
                    context_data_position++;
                }
                value = value >> 1;
            }

            //Flush the last char
            while (true)
            {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar - 1)
                {
                    context_data.Append(getCharFromInt(context_data_val));
                    break;
                }
                else context_data_position++;
            }
            return context_data.ToString();
        }

        public static string decompress(string compressed)
        {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return _decompress(compressed.Length, 32768, (index) => Convert.ToInt32(compressed[index]));
        }


        private struct dataStruct
        {
            public int val, position, index;
        }
        private static string _decompress(int length, int resetValue, GetNextValue getNextValue)
        {
            Dictionary<int, string> dictionary = new Dictionary<int, string>();
            int next, enlargeIn = 4, dictSize = 4, numBits = 3, i, bits, resb, maxpower, power;
            int c = 0;
            string entry = "", w;
            StringBuilder result = new StringBuilder();
            var data = new dataStruct() { val = getNextValue(0), position = resetValue, index = 1 };

            for (i = 0; i < 3; i++)
            {
                dictionary[i] = Convert.ToChar(i).ToString();
            }

            bits = 0;
            maxpower = (int)Math.Pow(2, 2);
            power = 1;
            while (power != maxpower)
            {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0)
                {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }

            switch (next = bits)
            {
                case 0:
                    bits = 0;
                    maxpower = (int)Math.Pow(2, 8);
                    power = 1;
                    while (power != maxpower)
                    {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0)
                        {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = Convert.ToInt32(f(bits));
                    break;
                case 1:
                    bits = 0;
                    maxpower = (int)Math.Pow(2, 16);
                    power = 1;
                    while (power != maxpower)
                    {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0)
                        {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = Convert.ToInt32(f(bits));
                    break;
                case 2:
                    return "";
            }
            dictionary[3] = Convert.ToChar(c).ToString();
            w = Convert.ToChar(c).ToString();
            result.Append(Convert.ToChar(c));
            while (true)
            {
                if (data.index > length)
                {
                    return "";
                }

                bits = 0;
                maxpower = (int)Math.Pow(2, numBits);
                power = 1;
                while (power != maxpower)
                {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0)
                    {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }

                switch (c = bits)
                {
                    case 0:
                        bits = 0;
                        maxpower = (int)Math.Pow(2, 8);
                        power = 1;
                        while (power != maxpower)
                        {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0)
                            {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }

                        dictionary[dictSize++] = f(bits).ToString();
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 1:
                        bits = 0;
                        maxpower = (int)Math.Pow(2, 16);
                        power = 1;
                        while (power != maxpower)
                        {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0)
                            {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = f(bits).ToString();
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 2:
                        return result.ToString();
                }

                if (enlargeIn == 0)
                {
                    enlargeIn = (int)Math.Pow(2, numBits);
                    numBits++;
                }

                if (dictionary.ContainsKey(c))
                {
                    entry = dictionary[c];
                }
                else
                {
                    if (c == dictSize)
                    {
                        entry = w + w[0].ToString();
                    }
                    else
                    {
                        return null;
                    }
                }
                result.Append(entry);

                //Add w+entry[0] to the dictionary.
                dictionary[dictSize++] = w + entry[0].ToString();
                enlargeIn--;
                w = entry;
                if (enlargeIn == 0)
                {
                    enlargeIn = (int)Math.Pow(2, numBits);
                    numBits++;
                }
            }
        }
    }
}
