Swashbuckle presentation

Swaggering Swashbucklers: the Buccaneers way to OpenAPI

Demos and overview of the full framework and core options for designing OpenAPI WebAPI applications and client code generation. Providing developers with mock endpoints with consistent and broad sample data with API versioning.

Tools to be covered are:

 • Swashbuckle (https://github.com/domaindrivendev/Swashbuckle)

 • AutoRest (https://github.com/Azure/autorest/issues/2680)

 • Microsoft.AspNet.WebApi.Versioning (https://github.com/microsoft/aspnet-api-versioning/blob/master/samples/webapi/SwaggerWebApiSample/SwaggerDefaultValues.cs)

 • Swashbuckle.Extensions ()
https://github.com/mattfrear/Swashbuckle.Examples
 • Ahoy

 • https://editor.swagger.io/

 • Swashbuckle Aspnet.core https://github.com/domaindrivendev/Swashbuckle.AspNetCore

**AUTOREST**
https://github.com/Azure/autorest
Installing AutoRest on Windows, MacOS or Linux involves two steps:
	1. Install Node.js (10.16.x LTS HIGHLY RECOMENDED)
	2. Install AutoRest using npm

```
npm install -g @autorest/autorest@preview
```

	3. # check which version was installed

```
	npm -g ls --depth=0
```

	4. # Removes all other versions and installs the latest

```
Autorest-v3 --reset
```

	5. Download YAML file eg. Petstore
	
```
>iwr https://raw.githubusercontent.com/Azure/autorest/master/Samples/1b-code-generation-multilang/petstore.yaml -o petstore.yaml
```

	6. # generate the client

```
> autorest-v3 --input-file=petstore.yaml --csharp --output-folder=CSharp_PetStore --namespace=PetStore config.yaml
```
The Microsoft.Rest.ClientRuntime.2.2.0 nuget package is required to compile the generated code.

	7. # show what got generated:

```
> dir CSharp_PetStore -r
```
	
	From <https://github.com/Azure/autorest/blob/master/docs/examples/generating-a-client.md> 
	
	
Support for OpenAPI v3 https://github.com/Azure/autorest/issues/2680

Create a configuration file (config.yaml) with the configuration:

```
---
use-extension:
  "@microsoft.azure/autorest.typescript": "2.6.0"
  "@microsoft.azure/autorest.csharp": "2.3.82"
use-datetimeoffset: true
license-header: NONE
input-file: Application_private-v1.json
# directives are the customization work
directive:
- from: swagger-document
  where: $.components.schemas.*.additionalProperties
  transform: |
    return typeof $ === "boolean"
      ? ($ ? { type: "object" } : undefined)
      : $
  reason: polyfill
- from: swagger-document
  where: $.paths.*.get.parameters[?(@.schema.type === "array")]
  transform: |    
    if ($.style === undefined) {
        $.style = "form";
        $.explode = true;
    }
  reason: polyfill
csharp:
  output-folder : output
```
and run it autorest config.yaml

From <https://github.com/Azure/autorest/issues/2680> 

```
autorest-v3 --input-file=values.yaml --csharp --output-folder=CSharp_Values --namespace=Values config.yaml
```


