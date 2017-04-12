/// <reference path="LightmappedBase.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class WaterMaterial extends LightmappedBaseMaterial {
            fogStart = 8192;
            fogEnd = 16384;
            fogColor = new Facepunch.Vector3(1, 1, 1);
        }

        export class Water extends LightmappedBase<WaterMaterial> {
            uInverseProjection = this.addUniform("uInverseProjection", WebGame.UniformMatrix4);
            uInverseView = this.addUniform("uInverseView", WebGame.UniformMatrix4);

            uScreenParams = this.addUniform("uScreenParams", WebGame.Uniform4F);

            uOpaqueColor = this.addUniform("uOpaqueColor", WebGame.UniformSampler);
            uOpaqueDepth = this.addUniform("uOpaqueDepth", WebGame.UniformSampler);

            uWaterFogParams = this.addUniform("uWaterFogParams", WebGame.Uniform4F);
            uWaterFogColor = this.addUniform("uWaterFogColor", WebGame.Uniform3F);

            constructor(context: WebGLRenderingContext) {
                super(context, WaterMaterial);

                this.sortOrder = -10;

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    void main()
                    {
                        LightmappedBase_main();
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    uniform vec4 ${this.uScreenParams};
                    uniform highp mat4 ${this.uProjection};
                    uniform mat4 ${this.uInverseProjection};
                    uniform mat4 ${this.uInverseView};

                    uniform sampler2D ${this.uOpaqueColor};
                    uniform sampler2D ${this.uOpaqueDepth};

                    uniform vec4 ${this.uWaterFogParams};
                    uniform vec3 ${this.uWaterFogColor};

                    vec4 CalcEyeFromWindow(in vec3 fragCoord)
                    {
                        vec3 ndcPos;
                        ndcPos.xy = (2.0 * fragCoord.xy) * (uScreenParams.zw) - vec2(1.0, 1.0);
                        ndcPos.z = (2.0 * fragCoord.z - gl_DepthRange.near - gl_DepthRange.far) / (gl_DepthRange.far - gl_DepthRange.near);

                        vec4 clipPos;
                        clipPos.w = ${this.uProjection}[3][2] / (ndcPos.z - (${this.uProjection}[2][2] / ${this.uProjection}[2][3]));
                        clipPos.xyz = ndcPos * clipPos.w;

                        return ${this.uInverseProjection} * clipPos;
                    }

                    vec3 GetWorldPos(float fragZ)
                    {
                        return (${this.uInverseView} * CalcEyeFromWindow(vec3(gl_FragCoord.xy, fragZ))).xyz;
                    }

                    void main()
                    {
                        vec2 screenPos = gl_FragCoord.xy * ${this.uScreenParams}.zw;

                        vec3 surfacePos = GetWorldPos(gl_FragCoord.z);
                        float opaqueDepthSample = texture2D(${this.uOpaqueDepth}, screenPos).r;
                        vec3 opaquePos = GetWorldPos(opaqueDepthSample);
                        vec3 opaqueColor = texture2D(${this.uOpaqueColor}, screenPos).rgb;

                        float opaqueDepth = surfacePos.z - opaquePos.z;
                        float relativeDepth = mix((opaqueDepth - ${this.uWaterFogParams}.x) * ${this.uWaterFogParams}.y, 1.0, float(opaqueDepthSample >= 0.99999));
                        float fogDensity = max(${this.uWaterFogParams}.z, min(${this.uWaterFogParams}.w, relativeDepth));

                        vec3 fogColor = ApplyFog(ApplyLightmap(${this.uWaterFogColor}));
                        vec3 waterFogged = mix(opaqueColor, fogColor, fogDensity);
                        gl_FragColor = vec4(waterFogged, 1.0);
                    }`);

                this.compile();
            }

            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void {
                super.bufferSetup(buf);

                this.uScreenParams.bufferParameter(buf, WebGame.Game.screenInfoParam);

                this.uInverseProjection.bufferParameter(buf, WebGame.Camera.inverseProjectionMatrixParam);
                this.uInverseView.bufferParameter(buf, WebGame.Camera.inverseViewMatrixParam);

                this.uOpaqueColor.bufferParameter(buf, WebGame.Camera.opaqueColorParam);
                this.uOpaqueDepth.bufferParameter(buf, WebGame.Camera.opaqueDepthParam);
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: WaterMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uWaterFogColor.bufferValue(buf, props.fogColor.x, props.fogColor.y, props.fogColor.z);
                this.uWaterFogParams.bufferValue(buf, props.fogStart, 1 / (props.fogEnd - props.fogStart), 0, 1);
            }
        }
    }
}