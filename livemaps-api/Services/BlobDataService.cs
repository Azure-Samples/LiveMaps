using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Newtonsoft.Json;

namespace ssir.api.Services
{
    public class BlobDataService
    {
        public async Task<string> GetContextData(BlobContainerClient container)
        {
            var datafileName = BuildContextDataFileName();
            var bacmapRef = container.GetBlobClient(datafileName);
            BlobDownloadResult result = await bacmapRef.DownloadContentAsync();
            string deviceStateData = result.Content.ToString();
            return deviceStateData;
        }

        public async Task<T> ReadBlobData<T>(BlobContainerClient container, string dataFileName)
        {
            var dataFileRef = container.GetBlobClient(dataFileName);
            BlobDownloadResult result = await dataFileRef.DownloadContentAsync();
            string deviceStateData = result.Content.ToString();
            return JsonConvert.DeserializeObject<T>(deviceStateData);
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
