using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    class UnitInfo : FloorInfo
    {
        private Random rnd = new Random();
        public string Unit { get; set; }
        public string UnitId
        {
            get
            {
                return $"{FloorId}-{Unit}".Replace(" ", "_");
            }
        }
        public int HeadCount
        {
            get
            {
                return Math.Abs(rnd.Next(50) - 20);
            }
        }

        public int WorkOrdersCount
        {
            get
            {
                return Math.Abs(rnd.Next(20) - 13);
            }
        }

        public string DeviceName { get; set; }
    }
}
