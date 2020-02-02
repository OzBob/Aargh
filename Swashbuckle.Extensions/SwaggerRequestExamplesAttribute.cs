using System;

namespace Swashbuckle.Extensions
{
    /// <summary>
    /// SwaggerRequestExamplesAttribute
    /// </summary>
    [AttributeUsage(AttributeTargets.Method)]
    public sealed class SwaggerRequestExamplesAttribute : Attribute
    {
        /// <summary>
        /// SwaggerRequestExamplesAttribute
        /// </summary>
        /// <param name="responseType"></param>
        /// <param name="examplesProviderType"></param>
        public SwaggerRequestExamplesAttribute(Type responseType, Type examplesProviderType)
        {
            ResponseType = responseType;
            ExamplesProviderType = examplesProviderType;
        }

        /// <summary>
        /// ExamplesProviderType
        /// </summary>
        public Type ExamplesProviderType { get; private set; }

        /// <summary>
        /// ResponseType
        /// </summary>
        public Type ResponseType { get; private set; }
    }

}
