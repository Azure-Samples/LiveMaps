# Live Maps

Sample Application to provide indoor maps visualization of IoT data on top of Azure Maps using [Azure Maps Creator](https://azure.microsoft.com/en-us/blog/azure-maps-creator-now-available-in-preview/)

![Main screen](images/app.png)

## Sample Architecture

The image bellow illustrates where the indoor maps integration elements fit into a larger, end-to-end IoT Smart Spaces scenario.

![Sample Architecture](docs/LiveMapsArchitecture.png)

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

Web application requires data feeds for visualizing.

## Simulation mode

Simulation mode is a way to edit available map's statesets in a convenient way by using the app's UI. Simulation mode
can be enabled by adding `sim` parameter to URL, e.g. `"http://localhost:3000/region/campus/bldg1/f1?sim=true"`. Once
simulation mode is enabled, simulation sliders will appear in sidebar after clicking on any room:

![Simulation controls](images/sim.png)

## Appendix

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). For more details
about development and configuration refer to the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
