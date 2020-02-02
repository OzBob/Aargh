using Swashbuckle.Swagger;
using Swashbuckle.Swagger.Annotations;
using System;
using System.Linq;
using System.Net;
using System.Web.Http.Description;

namespace Swashbuckle.Extensions
{
	// Disable all XML Comment warnings in this file // 
#pragma warning disable 1591

	/// <summary>
	/// Each SwaggerFileResponse Attribute Marked Controller Action that has Type of System.IO.File, 
	/// Will have Schema type set to "file"
	/// </summary>
	public class UpdateFileResponseTypeFilter : IOperationFilter
	{
		public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
		{
			if (apiDescription.GetControllerAndActionAttributes<SwaggerResponseRemoveDefaultsAttribute>().Any())
				operation.responses.Clear();

			var responseAttributes = apiDescription.GetControllerAndActionAttributes<SwaggerFileResponseAttribute>()
				.OrderBy(attr => attr.StatusCode);

			foreach (var attr in responseAttributes)
			{
				var statusCode = attr.StatusCode.ToString();

				Schema responseSchema = new Schema { format = "byte", type = "file" };

				operation.responses[statusCode] = new Response
				{
					description = attr.Description ?? InferDescriptionFrom(statusCode),
					schema = responseSchema
				};
			}

			var defaultResponseAttributes = apiDescription.GetControllerAndActionAttributes<SwaggerDefaultResponseAttribute>();

			foreach (var attr in defaultResponseAttributes)
			{
				var defaultResponse = new Response
				{
					description = "default",
					schema = (attr.Type != null) ? schemaRegistry.GetOrRegister(attr.Type) : null
				};

				operation.responses["default"] = defaultResponse;
			}
		}

		private string InferDescriptionFrom(string statusCode)
		{
			HttpStatusCode enumValue;
			if (Enum.TryParse(statusCode, true, out enumValue))
			{
				return enumValue.ToString();
			}
			return null;
		}
	}
}