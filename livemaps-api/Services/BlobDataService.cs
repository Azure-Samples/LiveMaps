using System.IO;
using System.Text;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Newtonsoft.Json;

namespace ssir.api.Services
{
    public class BlobDataService
    {
        public async Task<string> GetContextData(BlobContainerClient container)
        {            
            using (var ms = new MemoryStream())
            {
                var datafileName = BuildContextDataFileName();
                var bacmapRef = container.GetBlobClient(datafileName);
                await bacmapRef.DownloadToAsync(ms);
                ms.Position = 0;
                using (StreamReader reader = new StreamReader(ms, Encoding.UTF8))
                {
                    var data = reader.ReadToEnd();
                    return data;                    
                }
            }
        }

        public async Task<T> ReadBlobData<T>(BlobContainerClient container, string dataFileName)
        {
            using (var ms = new MemoryStream())
            {                
                var dataFileRef = container.GetBlobClient(dataFileName);
                await dataFileRef.DownloadToAsync(ms);
                ms.Position = 0;
                using (StreamReader reader = new StreamReader(ms, Encoding.UTF8))
                {
                    var data = reader.ReadToEnd();
                    return JsonConvert.DeserializeObject<T>(data);
                }
            }
        }

        //private static async Task<IEnumerable<BuildingConfig>> FetchAtlasConfig(CloudBlockBlob configRef)
        //{
        //    BuildingConfig[] cfg;
        //    using (var ms = new MemoryStream())
        //    {
        //        await configRef.DownloadToStreamAsync(ms);
        //        ms.Position = 0;
        //        using (StreamReader reader = new StreamReader(ms, Encoding.UTF8))
        //        {
        //            var featuresStr = reader.ReadToEnd();
        //            cfg = JsonConvert.DeserializeObject<BuildingConfig[]>(featuresStr);
        //        }
        //    }

        //    return cfg;
        //}

        public string BuildContextDataFileName()
        {
            return "global.json";
        }
    }
}
