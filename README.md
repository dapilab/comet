## Comet

OpenAPI Editor For Nerds

[![Netlify Status](https://api.netlify.com/api/v1/badges/b5072d5e-eeab-4391-93cd-4590bed35570/deploy-status)](https://app.netlify.com/sites/nostalgic-swanson-7dc1f9/deploys)

<img width="1741" alt="screenshot" src="https://user-images.githubusercontent.com/5305874/119372559-0825db80-bcea-11eb-9237-4b23bf01349e.png">

## Online Editor
[https://comet.chilllab.io](https://comet.chilllab.io)

## Example
[Petstore](https://comet.chilllab.io?example=petstore)

## Development
#### Env
* Node 12+

#### Steps
1. Clone the project into local `git clone git@github.com:chilllab/comet.git`
2. Into the project, run `yarn` or `npm install` to install dependencies
3. Run `make dev` to start the webpack-server in the local
4. Open the browser `http://localhost:8080`

## TODO
Still activly working on UIUX and bugs, any PRs, issues and suggestions are welcomed :)

- [ ] Support JSON (only YAML for the moment)
- [ ] Improve Curl
- [ ] Auth

## Help
#### How to start working on my API
* Import from outside file: Click the `Full Schema` in top-right, copy/paste your openAPI yaml and click `Save`
* From scratch: Mouse hover to the left `API` and `Component`, click `+` to create your api and component

#### How to create new project
Click the `New Project` in top-right

#### Where is my data saved
All in your local storage, so don't add too much projects :)

#### How to remove the project
In the top-right corner, click your project name, a project list will be show up and the first option is removing

## License
MIT
