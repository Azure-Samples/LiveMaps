using System;
using System.Collections.Generic;
using System.Text;

namespace ssir.api.Models
{
    public class Position
    {
        private double[][] coordinates;

        public Position() { }

        public Position(double[][] coordinates)
        {
            this.coordinates = coordinates;
            double sumLat = 0.0;
            double sumLng = 0.0;
            
            foreach(var coordinate in coordinates)
            {
                sumLat += coordinate[1];
                sumLng += coordinate[0];
                //{
                //    latitude = feature.Geometry.Coordinates[0][0][1],
                //    longitude = feature.Geometry.Coordinates[0][0][0]
                //};
            }
            latitude = sumLat / coordinates.Length;
            longitude = sumLng / coordinates.Length;
        }

        public double latitude { get; set; }
        public double longitude { get; set; }
    }
}
