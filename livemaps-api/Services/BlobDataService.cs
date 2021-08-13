using System.Text.Json;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Ssir.Api.Services
{
    public class BlobDataService
    {
        //Get Blob data in the form of string.
        public async Task<string> GetContextData(BlobContainerClient container)
        {
            //Get datafileName.
            var datafileName = BuildContextDataFileName();
            //Create a Blob client.
            var bacmapRef = container.GetBlobClient(datafileName);
            //Downloads a blob from the service.
            BlobDownloadResult result = await bacmapRef.DownloadContentAsync();
            string deviceStateData = result.Content.ToString();
            return deviceStateData;
        }

        public async Task<T> ReadBlobData<T>(BlobContainerClient container, string dataFileName)
        {
            //Create a Blob client.
            var dataFileRef = container.GetBlobClient(dataFileName);
            //Downloads a blob from the service.
            BlobDownloadResult result = await dataFileRef.DownloadContentAsync();
            string deviceStateData = result.Content.ToString();
            return JsonSerializer.Deserialize<T>(deviceStateData);
        }

        public string BuildContextDataFileName()
        {
            return "global.json";
        }
    }
}
