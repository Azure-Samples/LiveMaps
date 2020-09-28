using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class FloorInfo
    {        
        public string Region { get; set; }
        public string RegionId
        {
            get
            {
                return Region.ToLower().Replace(" ", "");
            }
        }
        public string Campus { get; set; }
        public string CampusId 
        {
            get
            {
                return $"{RegionId}/{Campus}".ToLower().Replace(" ", "");
            } 
        }
        public string Building { get; set; }
        public string BuildingId
        {
            get
            {
                return $"{CampusId}/{Building}".ToLower().Replace(" ", "");
            }
        }

        public double Area { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Floor { get; set; }
        public string FloorId
        {
            get
            {
                return $"{BuildingId}/{Floor}".ToLower().Replace(" ", "");
            }
        }
    }
}
