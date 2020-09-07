# Smart Spaces

Application to visualize ant interact with smart buildings using Azure Maps

![Main screen](images/app.png)

## Configuration

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

## Simulation mode

Simulation mode is a way to edit available map's statesets in a convenient way by using the app's UI. Simulation mode
can be enabled by adding `sim` parameter to URL, e.g. `"http://localhost:3000/region/campus/bldg1/f1?sim=true"`. Once
simulation mode is enabled, simulation sliders will appear in sidebar after clicking on any room:

![Simulation controls](images/sim.png)

## Appendix

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). For more details
about development and configuration refer to the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
