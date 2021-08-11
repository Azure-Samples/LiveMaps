using System;
using System.Text;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Ssir.Api.Services;

namespace Ssir.Api
{
    public static class SiteMap
    {
        [FunctionName("SiteMap")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = null)] HttpRequest req,
            [Blob("shared", Connection = "AzureWebJobsStorage")] BlobContainerClient container,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");
            bool prerequisites = true;

            var errors = new StringBuilder();
            string siteMap = "sitemap";

            string rebuild = req.Query["rebuild"];
            bool full = rebuild == "full";

            var siteMapFile = Environment.GetEnvironmentVariable("SiteMapFile");
            if (string.IsNullOrEmpty(siteMapFile))
            {
                prerequisites = false;
                errors.Append("DataBase Connection String property {siteMapFile} is not defined!");
            }

            var atlasConfigFile = Environment.GetEnvironmentVariable("AtlasConfigFile") ?? "atlasConfig.json";
            var bds = new BlobDataService(); 
            
            if (prerequisites)
            {
                //Create a new container if the container not exists.
                await container.CreateIfNotExistsAsync();
                //Create a Blob client.
                var siteMapRef = container.GetBlobClient(siteMapFile);                

                try
                {
                    if (!string.IsNullOrEmpty(rebuild))
                    {
                        if (prerequisites)
                        {
                            // Custom Sitemap builder code                       
                        }
                    }  
                    else
                    {
                        if (prerequisites)
                        {
                            //Downloads a blob from the service.
                            BlobDownloadResult result = await siteMapRef.DownloadContentAsync();
                            string deviceStateData = result.Content.ToString();
                            return new OkObjectResult(deviceStateData);
                        }
                    }
                }
                catch (Exception ex)
                {
                    errors.Append(ex.Message);
                }
            }

            if (!prerequisites || errors.Length > 0)
            {
                log.LogError(errors.ToString());
                return new NotFoundResult();
            }

            return new OkObjectResult(siteMap);
        }
    }
}
