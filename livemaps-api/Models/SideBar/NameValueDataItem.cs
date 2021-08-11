using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Ssir.Api.Models.SideBar
{
    public class NameValueDataItem
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("value")]
        public string Value { get; set; }
    }
}
