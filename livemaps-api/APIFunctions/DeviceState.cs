using System;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;

namespace Ssir.Api
{
    public static class DeviceState
    {
        [FunctionName("DeviceState")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "state/{region}/{campus}/{building}/{level?}")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] BlobContainerClient container,
            string region,
            string campus,
            string building,
            string level,
            ILogger log)
        {
            string fileName;
            try
            {
                if (string.IsNullOrEmpty(level))
                {
                    fileName = $"{region}_{campus}_{building}_currentState.json";
                }
                else
                {
                    fileName = $"{region}_{campus}_{building}_{level}_currentState.json";
                }

                fileName = fileName.ToLower();
                //Create a Blob client.
                var deviceStateRef = container.GetBlobClient(fileName);
                //Downloads a blob from the service.
                BlobDownloadResult result = await deviceStateRef.DownloadContentAsync();
                string deviceStateData = result.Content.ToString();
                return new OkObjectResult(deviceStateData);
            }
            catch(Exception ex)
            {
                log.LogError(ex.Message);
                return new NotFoundObjectResult("Data not found!");
            }
        }
    }
}
