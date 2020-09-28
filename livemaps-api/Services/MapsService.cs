using Newtonsoft.Json;
using ssir.api.Models.Atlas;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace ssir.api.Services
{
    public class MapsService
    {
        private string subscriptionKey;
        private string statesetId;
        private string datasetId;
        private string azmapsRoot = "https://us.atlas.microsoft.com/featureState/state";

        public MapsService(string subscriptionKey, string datasetId, string statesetId)
        {
            this.subscriptionKey = subscriptionKey;
            this.datasetId = datasetId;
            this.statesetId = statesetId;
        }

        public async Task<string> UpdateTagState(string stateSetName, string featureId, string newValue)
        {
            using (var client = new HttpClient())
            {
                var baseUri = new StringBuilder(azmapsRoot);
                if (azmapsRoot[azmapsRoot.Length - 1] != '?')
                {
                    baseUri.Append('?');
                }

                var queryParams = new Dictionary<string, string>();
                queryParams.Add("api-version", "1.0");
                queryParams.Add("statesetId", statesetId);
                queryParams.Add("datasetId", datasetId);
                queryParams.Add("featureId", featureId);
                queryParams.Add("subscription-key", subscriptionKey);

                foreach (var queryParam in queryParams)
                {
                    baseUri.Append($"{queryParam.Key}={queryParam.Value}&");
                }

                baseUri.Remove(baseUri.Length - 1, 1);


                HttpRequestMessage requestMessage = new HttpRequestMessage(HttpMethod.Post, baseUri.ToString());

                var bodymessage = new
                {
                    states = new[] {
                new {
                    keyName = stateSetName,
                    value = newValue,
                    eventTimestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss")
                    }
                }
                };

                string content = JsonConvert.SerializeObject(bodymessage);

                requestMessage.Content = new StringContent(content);
                requestMessage.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

                var response = await client.SendAsync(requestMessage);
                var result = await response.Content.ReadAsStringAsync();

                return result;
            }
        }

        internal static async Task<List<Feature>> FetchFeaturesFromAtlas(string atlasDataSetId, string atlasSubscriptionKey)
        {
            List<Feature> features = new List<Feature>();
            var limit = 50;
            string url = $"https://us.atlas.microsoft.com/wfs/datasets/{atlasDataSetId}/collections/unit/items?api-version=1.0&limit={limit}&subscription-key={atlasSubscriptionKey}";
            for (int i = 0; ; i++)
            {
                using (var client = new HttpClient())
                {
                    HttpRequestMessage requestMessage = new HttpRequestMessage(HttpMethod.Get, url);
                    var response = await client.SendAsync(requestMessage);

                    if (response.StatusCode != HttpStatusCode.OK)
                        break;

                    var result = await response.Content.ReadAsStringAsync();

                    var featureCollection = JsonConvert.DeserializeObject<FeatureCollection>(result);
                    features.AddRange(featureCollection.Features);

                    if (featureCollection.NumberReturned < limit)
                        break;
                    var nextLink = featureCollection.links.FirstOrDefault(f => f.rel == "next");
                    if (nextLink == null)
                        break;
                    else
                        url = nextLink.href.Replace("https://atlas", "https://us.atlas") + $"&subscription-key={atlasSubscriptionKey}";
                }
            }

            return features;
        }       
    }
}
