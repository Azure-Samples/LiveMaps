using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Ssir.Api.Models.SideBar
{
    public class LabelItem
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("data")]
        public NameValueDataItem Data { get; set; }
    }
}
