﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Ssir.Api.Models.SideBar
{
    public class LabelItem
    {
        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("data")]
        public NameValueDataItem Data { get; set; }
    }
}
