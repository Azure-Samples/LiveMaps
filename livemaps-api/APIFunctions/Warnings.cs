using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Text;
using Microsoft.WindowsAzure.Storage.Blob;

namespace ssir.api
{
    public static class Warnings
    {
        [FunctionName("Warnings")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "faults/{region}/{campus}/{building}")] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] CloudBlobContainer container,
            string region,
            string campus,
            string building,            
            ILogger log)
        {
            string fileName;
            try
            {
                if (!string.IsNullOrEmpty(building))
                {
                    fileName = $"{region}_{campus}_{building}_warnings.json".ToLower();
                }
                else
                {
                    return new NotFoundObjectResult("Data not found!");
                }

                var devicestateref = container.GetBlockBlobReference(fileName);
                using (var ms = new MemoryStream())
                {
                    await devicestateref.DownloadToStreamAsync(ms);
                    ms.Position = 0;
                    using (StreamReader reader = new StreamReader(ms, Encoding.UTF8))
                    {
                        var deviceStateData = reader.ReadToEnd();
                        return new OkObjectResult(deviceStateData);
                    }
                };
            }
            catch(Exception ex)
            {
                log.LogError(ex.Message);
                return new NotFoundObjectResult("Data not found!");
            }
        }
    }
}
