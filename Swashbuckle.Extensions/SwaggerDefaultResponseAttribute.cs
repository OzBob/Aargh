using Swashbuckle.Swagger.Annotations;
using System;
using System.Net;

namespace Swashbuckle.Extensions
{
	/// <summary>
	/// SwaggerDefaultResponseAttribute
	/// </summary>
	[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
	public sealed class SwaggerDefaultResponseAttribute : Attribute
	{

		public SwaggerDefaultResponseAttribute(Type type)
		{
			Type = type;
		}

		public Type Type { get; set; }
	}
}