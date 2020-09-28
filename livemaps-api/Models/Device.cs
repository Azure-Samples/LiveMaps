using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class Device
    {
        public string DeviceId { get; set; }
        public string EquipmentClass { get; set; }
        public string Equipment { get; set; }
        public List<DeviceTag> Tags = new List<DeviceTag>();
    }

    public class DeviceTag
    {
        public string Tag { get; set; }
        public string Value { get; set; }
        public string TimeStamp { get; set; }

    }
}
