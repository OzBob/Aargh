using System;

namespace MYOBApiProxy.SwaggerExtensions
{
    /// <summary>
    /// SwaggerResponseExamplesAttribute
    /// </summary>
    [AttributeUsage(AttributeTargets.Method)]
    public sealed class SwaggerResponseExamplesAttribute : Attribute
    {
        /// <summary>
        /// SwaggerResponseExamplesAttribute
        /// </summary>
        /// <param name="responseType"></param>
        /// <param name="examplesProviderType"></param>
        public SwaggerResponseExamplesAttribute(Type responseType, Type examplesProviderType)
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
