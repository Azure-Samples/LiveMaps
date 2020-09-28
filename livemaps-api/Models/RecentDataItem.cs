using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class RecentDataItem
    {
        public string Region { get; set; }
        public string Campus { get; set; }
        public string Building { get; set; }
        public string Level { get; set; }
        public string Unit { get; set; }
        public string Room { get; set; }
        public string FeatureId { get; set; }
        public string DeviceId { get; set; }
        public string EquipmentClass { get; set; }
        public string Equipment { get; set; }
        public string Tag { get; set; }
        public string Value { get; set; }
        public string TimeStamp { get; set; }
    }
}
