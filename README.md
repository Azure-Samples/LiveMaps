# Live Maps

Sample Application to provide indoor maps visualization of IoT data on top of Azure Maps using [Azure Maps Creator](https://azure.microsoft.com/en-us/blog/azure-maps-creator-now-available-in-preview/)

![Main screen](images/app.png)

## Sample Architecture

The image bellow illustrates where the indoor maps integration elements fit into a larger, end-to-end IoT Smart Spaces scenario.

![Sample Architecture](docs/LiveMapsArchitecture.png)

Example scenario:

- Occupancy sensor detects 6 people in the room and sends this data to IoTHub
- During data enrichment and refinement stage we identify what exactly room this data is refering to and it's constraints
- In stream analytics we apply rules on top of the streaming data (room capacity is 4 people) and output EventHub event
- Telemetry Publisher function receives new ipdate event from Event Hub and updates Azure Maps Creator Feature state
- Warning is automatically displayed on the Azure Maps UI within 15 seconds

## Prerequisites

- [Make an Azure Maps account](https://docs.microsoft.com/en-us/azure/azure-maps/quick-demo-map-app#create-an-azure-maps-account)
- [Obtain a subscription key](https://docs.microsoft.com/en-us/azure/azure-maps/quick-demo-map-app#get-the-primary-key-for-your-account)
- [Create Azure Maps Creator resource](https://docs.microsoft.com/en-us/azure/azure-maps/how-to-manage-creator)
- Follow the Azure Maps [Tutorial: Use Azure Maps Creator to create indoor maps](https://docs.microsoft.com/en-us/azure/azure-maps/tutorial-creator-indoor-maps) to create an Azure maps indoor map.
- Upload your Own Drawing package or use sample drawing as a starter
- Create Feature statesets for each dimension of your data that needs to be visualized separetely

## Web App Configuration

The application is configured using [environment variables](https://create-react-app.dev/docs/adding-custom-environment-variables).
You can pass you own configuration by changing the values in `.env` file or by passing them via command line on define
them in your favorite CI tool.

Currently the supported variables are:

- `REACT_APP_MAP_SUBSCRIPTION_KEY` (_required_) - the subscription key to your Azure Maps instance.
- `REACT_APP_API_BASE_URL` - (_optional, defaults to `http://localhost:3001`_) - the base URL for all data-fetching facilities
- `REACT_APP_TRACKER_HOSTNAME` - (_optional, defaults to `localhost:3001`_) - hostname of the tracker service , providing
live data for tracking layers. Note that the value must not contain scheme.

The following URLs can be defined as either relative to base url above (when starting with `/` - they will be prepended
by base URL automatically) or as full URLs, pointing to the source other than defined by base URL.

- `REACT_APP_SITEMAP_URL` (_optional, defaults to `/sitemap`_) - the URL to fetch sitemap data from

The URLs below need to contain a `{locationPath}` placeholder which will be replaced with current location's id/path

- `REACT_APP_SENSORDATA_URL` (_optional, defaults to `/state/{locationPath}`_) - the URL to fetch sensor data from.
- `REACT_APP_SIDEBAR_DATA_URL` (_optional, defaults to `/sidebar/{locationPath}`_) - the URL to fetch sidebar chart data from.
- `REACT_APP_WARNINGS_DATA_URL` (_optional, defaults to `/faults/{locationPath}`_) - the URL to fetch warnings from.

## Server side configuration

Web application requires data feeds for visualizing, livemaps-api Function App project is an sample backend for the Azure Maps Creator Web UI.
LiveMaps application supports visualization for multiple Azure Maps Creator datasets and statesets, it requires multiple configs to be stored.
Here is an example of the configuration file used by the application:

    [        
        {
            "subscriptionKey":"[AzureMapsSubscriptionKey1]",
            "datasetId":"2f086edd-aaaa-1111-bbbb-3b230baeb881",
            "buildingId": "pugetsound/westcampus/b121",           
            "tilesetId":"0445b23c-2023-a6fc-64a0-174551a947cb",
            "stateSets":[
                {
                    "stateSetName":"temperature",
                    "stateSetId":"4776884c-aaaa-1111-bbbb-a45a95019d03"
                },
                {
                    "stateSetName":"occupancy",
                    "stateSetId":"9ace7925-aaaa-1111-bbbb-257da031b5c7"
                }
            ],
            "facilityId":"Building121"       
        },
        {
            "subscriptionKey":"[AzureMapsSubscriptionKey2]",
            "datasetId":"2f086edd-aaaa-2222-bbbb-3b230baeb881",       
            "buildingId":"pugetsound/eastcampus/b40",          
            "tilesetId":"29e995fe-aaaa-1111-bbbb-22e2e73a988b",
            "stateSets":[
                {
                    "stateSetName":"temperature",
                    "stateSetId":"6f5cf25d-aaaa-1111-bbbb-ed28c1ec4b7b"
                },
                {
                    "stateSetName":"occupancy",
                    "stateSetId":"9ace7925-aaaa-1111-bbbb-257da031b5c7"
                }
            ],
            "facilityId":"Building40"       
        }
    ]

## Sitemap file sample

    {
        "global": {
            "items": [
                "pugetsound"
            ],
            "name": "Global",
            "id": "global",
            "parentId": null,
            "type": "global",
            "latitude": 50.104882,
            "longitude": 32.66734,
            "area": 45058050.3
        },
        "pugetsound": {
            "items": [
                "pugetsound/eastcampus",
                "pugetsound/westcampus"
            ],
            "name": "PUGET SOUND",
            "id": "pugetsound",
            "parentId": "global",
            "type": "region",
            "latitude": 47.64059101,
            "longitude": -122.131319,
            "area": 14235605.0
        },
        "pugetsound/westcampus": {
            "items": [
                "pugetsound/westcampus/b121"
            ],
            "name": "WestCampus",
            "id": "pugetsound/westcampus",
            "parentId": "pugetsound",
            "type": "campus",
            "latitude": 47.64029462,
            "longitude": -122.1375847,
            "area": 5262977.0
        },
        "pugetsound/eastcampus": {
            "items": [
                "pugetsound/eastcampus/b40"
            ],
            "name": "EastCampus",
            "id": "pugetsound/eastcampus",
            "parentId": "pugetsound",
            "type": "campus",
            "latitude": 47.64126329,
            "longitude": -122.1255684,
            "area": 4127849.0
        },
        "pugetsound/westcampus/b121": {
            "items": [
                "pugetsound/westcampus/b121/l01",
                "pugetsound/westcampus/b121/l02",
                "pugetsound/westcampus/b121/l03"
            ],
            "name": "B121",
            "id": "pugetsound/westcampus/b121",
            "parentId": "pugetsound/westcampus",
            "type": "building",
            "latitude": 47.64777601,
            "longitude": -122.1369517,
            "area": 180270.0,
            "config": {
                "buildingId": "pugetsound/westcampus/b121",
                "tilesetId": "[tilesetId]",
                "stateSets": [
                    {
                        "stateSetName": "temperature",
                        "stateSetId": "[stateSetId]"
                    },
                    {
                        "stateSetName": "occupancy",
                        "stateSetId": "[stateSetId]"
                    }
                ],
                "facilityId": "FCL19"
            }
        },
        "pugetsound/westcampus/b121/l01": {
            "items": [],
            "name": "L01",
            "id": "pugetsound/westcampus/b121/l01",
            "parentId": "pugetsound/westcampus/b121",
            "type": "floor",
            "latitude": 47.64777601,
            "longitude": -122.1369517,
            "area": 180270.0
        },
        "pugetsound/westcampus/b121/l02": {
            "items": [],
            "name": "L02",
            "id": "pugetsound/westcampus/b121/l02",
            "parentId": "pugetsound/westcampus/b121",
            "type": "floor",
            "latitude": 47.64777601,
            "longitude": -122.1369517,
            "area": 180270.0
        },
        "pugetsound/westcampus/b121/l03": {
            "items": [],
            "name": "L03",
            "id": "pugetsound/westcampus/b121/l03",
            "parentId": "pugetsound/westcampus/b121",
            "type": "floor",
            "latitude": 47.64777601,
            "longitude": -122.1369517,
            "area": 180270.0
        },
        "pugetsound/eastcampus/b40": {
            "items": [
                "pugetsound/eastcampus/b40/l01"
            ],
            "name": "B40",
            "id": "pugetsound/eastcampus/b40",
            "parentId": "pugetsound/eastcampus",
            "type": "building",
            "latitude": 47.63641256,
            "longitude": -122.1331805,
            "area": 201141.0,
            "config": {
                "buildingId": "pugetsound/eastcampus/b40",
                "tilesetId": "[tileSetId]",
                "stateSets": [
                    {
                        "stateSetName": "temperature",
                        "stateSetId": "[stateSetId]"
                    },
                    {
                        "stateSetName": "occupancy",
                        "stateSetId": "[stateSetId]"
                    }
                ],
                "facilityId": "FCL13"
            }
        },
        "pugetsound/eastcampus/b40/l01": {
            "items": [],
            "name": "L01",
            "id": "pugetsound/eastcampus/b40/l01",
            "parentId": "pugetsound/eastcampus/b40",
            "type": "floor",
            "latitude": 47.63641256,
            "longitude": -122.1331805,
            "area": 201141.0
        }
    }

## Simulation mode

Simulation mode is a way to edit available map's statesets in a convenient way by using the app's UI. Simulation mode
can be enabled by adding `sim` parameter to URL, e.g. `"http://localhost:3000/region/campus/bldg1/f1?sim=true"`. Once
simulation mode is enabled, simulation sliders will appear in sidebar after clicking on any room:

![Simulation controls](images/sim.png)

## Appendix

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). For more details
about development and configuration refer to the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
