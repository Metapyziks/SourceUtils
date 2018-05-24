/// <reference path="LightmappedBase.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class WaterMaterial extends LightmappedBaseMaterial {
            fogStart = 8192;
            fogEnd = 16384;
            fogColor = new Facepunch.Vector3(1, 1, 1);
            fogLightmapped = true;
            translucent = true;
            refract = true;
            refractTint = new Facepunch.Vector3(1, 1, 1);
            normalMap: WebGame.Texture = null;
            cullFace = false;
        }

        export class Water extends LightmappedBase<WaterMaterial> {
            uCameraPos = this.addUniform("uCameraPos", WebGame.Uniform3F);

            uInverseProjection = this.addUniform("uInverseProjection", WebGame.UniformMatrix4);
            uInverseView = this.addUniform("uInverseView", WebGame.UniformMatrix4);

            uScreenParams = this.addUniform("uScreenParams", WebGame.Uniform4F);

            uOpaqueColor = this.addUniform("uOpaqueColor", WebGame.UniformSampler);
            uOpaqueDepth = this.addUniform("uOpaqueDepth", WebGame.UniformSampler);

            uWaterFogParams = this.addUniform("uWaterFogParams", WebGame.Uniform4F);
            uWaterFogColor = this.addUniform("uWaterFogColor", WebGame.Uniform3F);
            uWaterFogLightmapped = this.addUniform("uWaterFogLightmapped", WebGame.Uniform1F);

            uNormalMap = this.addUniform("uNormalMap", WebGame.UniformSampler);
            uRefractTint = this.addUniform("uRefractTint", WebGame.Uniform3F);

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

                    uniform vec3 ${this.uCameraPos};

                    uniform vec4 ${this.uScreenParams};
                    uniform highp mat4 ${this.uProjection};
                    uniform mat4 ${this.uInverseProjection};
                    uniform mat4 ${this.uInverseView};

                    uniform sampler2D ${this.uOpaqueColor};
                    uniform sampler2D ${this.uOpaqueDepth};

                    uniform vec4 ${this.uWaterFogParams};
                    uniform vec3 ${this.uWaterFogColor};
                    uniform float ${this.uWaterFogLightmapped};

                    uniform sampler2D ${this.uNormalMap};
                    uniform vec3 ${this.uRefractTint};

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

                    vec3 GetWorldPos(vec3 coord)
                    {
                        return (${this.uInverseView} * CalcEyeFromWindow(coord * vec3(${this.uScreenParams}.xy, 1.0))).xyz;
                    }

                    void main()
                    {
                        vec2 screenPos = gl_FragCoord.xy * ${this.uScreenParams}.zw;

                        vec3 normalSample = texture2D(${this.uNormalMap}, vTextureCoord).xyz;
                        vec3 normal = normalize(normalSample - vec3(0.5, 0.5, 0.5));
                        vec3 surfacePos = GetWorldPos(vec3(screenPos, gl_FragCoord.z));
                        vec3 viewDir = normalize(surfacePos - uCameraPos);

                        vec3 lightmap = ApplyLightmap(vec3(1.0, 1.0, 1.0));
                        float normalDot = abs(dot(viewDir, normal));

                        float opaqueDepthSample = texture2D(${this.uOpaqueDepth}, screenPos).r;
                        vec3 opaquePos = GetWorldPos(vec3(screenPos, opaqueDepthSample));
                        float opaqueDepth = length(surfacePos - opaquePos);
                        vec2 refractedScreenPos = screenPos + normal.xy * min(opaqueDepth, 128.0) / max(512.0, length(surfacePos - ${this.uCameraPos}) * 2.0);
                        float refractedOpaqueDepthSample = texture2D(${this.uOpaqueDepth}, refractedScreenPos).r;

                        vec3 opaqueColor;
                        if (refractedOpaqueDepthSample > gl_FragCoord.z) {
                            opaqueColor = texture2D(${this.uOpaqueColor}, refractedScreenPos).rgb;
                            opaqueDepth = length(surfacePos - GetWorldPos(vec3(refractedScreenPos, refractedOpaqueDepthSample)));
                        } else {
                            opaqueColor = texture2D(${this.uOpaqueColor}, screenPos).rgb;
                            opaqueDepth = length(surfacePos - opaquePos);
                        }

                        float relativeDepth = (opaqueDepth - ${this.uWaterFogParams}.x) * ${this.uWaterFogParams}.y;
                        float fogDensity = max(${this.uWaterFogParams}.z, min(${this.uWaterFogParams}.w * 0.5, relativeDepth));

                        vec3 waterFogColor = ${this.uWaterFogColor};

                        if (${this.uWaterFogLightmapped} > 0.5) {
                            waterFogColor *= lightmap;
                        }

                        vec3 waterFogged = mix(opaqueColor, ApplyFog(waterFogColor), fogDensity);
                        gl_FragColor = vec4(waterFogged, 1.0);
                    }`);

                this.uOpaqueColor.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uOpaqueDepth.setDefault(WebGame.TextureUtils.getBlackTexture(context));

                this.uNormalMap.setDefault(WebGame.TextureUtils.getErrorTexture(context));

                this.compile();
            }

            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void {
                super.bufferSetup(buf);

                this.uCameraPos.bufferParameter(buf, WebGame.Camera.cameraPosParam);
                this.uScreenParams.bufferParameter(buf, WebGame.Game.screenInfoParam);

                this.uInverseProjection.bufferParameter(buf, WebGame.Camera.inverseProjectionMatrixParam);
                this.uInverseView.bufferParameter(buf, WebGame.Camera.inverseViewMatrixParam);
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: WaterMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uWaterFogColor.bufferValue(buf, props.fogColor.x, props.fogColor.y, props.fogColor.z);
                this.uWaterFogParams.bufferValue(buf, props.fogStart, 1 / (props.fogEnd - props.fogStart), 0, 1);
                this.uWaterFogLightmapped.bufferValue(buf, props.fogLightmapped ? 1 : 0);

                this.uNormalMap.bufferValue(buf, props.normalMap);
                this.uRefractTint.bufferValue(buf, props.refractTint.x, props.refractTint.y, props.refractTint.z);

                if (props.translucent) {
                    this.uOpaqueColor.bufferParameter(buf, WebGame.Camera.opaqueColorParam);
                    this.uOpaqueDepth.bufferParameter(buf, WebGame.Camera.opaqueDepthParam);
                } else {
                    this.uOpaqueColor.bufferValue(buf, null);
                    this.uOpaqueDepth.bufferValue(buf, null);
                }
            }
        }
    }
}