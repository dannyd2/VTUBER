// VTuber Toon Shader — Unity URP
// Implements anime-style cel shading with rim light, outline pass, and
// optional emissive highlights. Works with VRM 1.0 avatars.

Shader "VTuber/Toon"
{
    Properties
    {
        // ── Base ───────────────────────────────────────────────────────────
        _BaseMap        ("Albedo",              2D)     = "white" {}
        _BaseColor      ("Base Color",          Color)  = (1,1,1,1)
        _Cutoff         ("Alpha Cutoff",        Range(0,1)) = 0.5

        // ── Toon shading ───────────────────────────────────────────────────
        _ShadowThreshold("Shadow Threshold",    Range(0,1)) = 0.4
        _ShadowFeather  ("Shadow Feather",      Range(0,0.3)) = 0.04
        _ShadowColor    ("Shadow Color",        Color)  = (0.55,0.47,0.62,1)
        _MidThreshold   ("Mid Threshold",       Range(0,1)) = 0.7
        _MidFeather     ("Mid Feather",         Range(0,0.2)) = 0.03
        _HighColor      ("Highlight Color",     Color)  = (0.95,0.92,1.0,1)
        _HighThreshold  ("Highlight Threshold", Range(0,1)) = 0.92
        _HighFeather    ("Highlight Feather",   Range(0,0.1)) = 0.02

        // ── Rim light ─────────────────────────────────────────────────────
        _RimColor       ("Rim Color",           Color)  = (0.8,0.5,1.0,1)
        _RimStrength    ("Rim Strength",        Range(0,2)) = 0.55
        _RimPow         ("Rim Sharpness",       Range(0.5,8)) = 2.5

        // ── Specular ──────────────────────────────────────────────────────
        _SpecColor      ("Specular Color",      Color)  = (1,1,1,0.6)
        _SpecSmooth     ("Specular Smoothness", Range(0,1)) = 0.72
        _SpecThreshold  ("Specular Threshold",  Range(0,1)) = 0.88

        // ── Outline ───────────────────────────────────────────────────────
        _OutlineColor   ("Outline Color",       Color)  = (0.07,0.03,0.12,1)
        _OutlineWidth   ("Outline Width",       Range(0,0.02)) = 0.004
        _OutlineZOffset ("Outline Z Offset",    Range(0,0.02)) = 0.001

        // ── Emissive ──────────────────────────────────────────────────────
        _EmissionMap    ("Emission Map",        2D)     = "black" {}
        _EmissionColor  ("Emission Color",      Color)  = (0,0,0,1)

        // ── Normal ────────────────────────────────────────────────────────
        _BumpMap        ("Normal Map",          2D)     = "bump" {}
        _BumpScale      ("Normal Scale",        Float)  = 1.0
    }

    SubShader
    {
        Tags
        {
            "RenderType"  = "Opaque"
            "Queue"       = "Geometry"
            "RenderPipeline" = "UniversalPipeline"
            "UniversalMaterialType" = "Lit"
        }

        // ══════════════════════════════════════════════════════════════════
        // Pass 1 — Outline (back-face expanded)
        // ══════════════════════════════════════════════════════════════════
        Pass
        {
            Name "Outline"
            Tags { "LightMode" = "SRPDefaultUnlit" }

            Cull Front
            ZWrite On

            HLSLPROGRAM
            #pragma vertex   OutlineVert
            #pragma fragment OutlineFrag
            #pragma multi_compile_fog
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float4 _OutlineColor;
                float  _OutlineWidth;
                float  _OutlineZOffset;
                float4 _BaseMap_ST;
            CBUFFER_END

            TEXTURE2D(_BaseMap); SAMPLER(sampler_BaseMap);

            struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; float2 uv : TEXCOORD0; };
            struct Varyings   { float4 positionCS : SV_POSITION; float  fogFactor : TEXCOORD0; };

            Varyings OutlineVert(Attributes IN)
            {
                Varyings OUT;
                float3 normal = normalize(TransformObjectToWorldNormal(IN.normalOS));
                float3 wPos   = TransformObjectToWorld(IN.positionOS.xyz);
                wPos += normal * _OutlineWidth;
                OUT.positionCS = TransformWorldToHClip(wPos);
                OUT.positionCS.z += _OutlineZOffset * OUT.positionCS.w;
                OUT.fogFactor = ComputeFogFactor(OUT.positionCS.z);
                return OUT;
            }

            half4 OutlineFrag(Varyings IN) : SV_Target
            {
                half4 col = _OutlineColor;
                col.rgb = MixFog(col.rgb, IN.fogFactor);
                return col;
            }
            ENDHLSL
        }

        // ══════════════════════════════════════════════════════════════════
        // Pass 2 — Forward Lit (toon shading)
        // ══════════════════════════════════════════════════════════════════
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }

            Cull Back
            ZWrite On
            Blend One Zero

            HLSLPROGRAM
            #pragma vertex   ToonVert
            #pragma fragment ToonFrag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile _ _ADDITIONAL_LIGHTS
            #pragma multi_compile _ _SHADOWS_SOFT
            #pragma multi_compile_fog

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float4 _BaseColor;
                float4 _BaseMap_ST;
                float  _ShadowThreshold;
                float  _ShadowFeather;
                float4 _ShadowColor;
                float  _MidThreshold;
                float  _MidFeather;
                float4 _HighColor;
                float  _HighThreshold;
                float  _HighFeather;
                float4 _RimColor;
                float  _RimStrength;
                float  _RimPow;
                float4 _SpecColor;
                float  _SpecSmooth;
                float  _SpecThreshold;
                float4 _EmissionColor;
                float  _BumpScale;
            CBUFFER_END

            TEXTURE2D(_BaseMap);    SAMPLER(sampler_BaseMap);
            TEXTURE2D(_BumpMap);    SAMPLER(sampler_BumpMap);
            TEXTURE2D(_EmissionMap);SAMPLER(sampler_EmissionMap);

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS   : NORMAL;
                float4 tangentOS  : TANGENT;
                float2 uv         : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS  : SV_POSITION;
                float2 uv          : TEXCOORD0;
                float3 positionWS  : TEXCOORD1;
                float3 normalWS    : TEXCOORD2;
                float3 tangentWS   : TEXCOORD3;
                float3 bitangentWS : TEXCOORD4;
                float  fogFactor   : TEXCOORD5;
                float4 shadowCoord : TEXCOORD6;
            };

            // Smooth step between two thresholds for soft cel bands
            float CelStep(float ndotl, float threshold, float feather)
            {
                return smoothstep(threshold - feather, threshold + feather, ndotl);
            }

            Varyings ToonVert(Attributes IN)
            {
                Varyings OUT;
                VertexPositionInputs posInputs = GetVertexPositionInputs(IN.positionOS.xyz);
                VertexNormalInputs   nrmInputs = GetVertexNormalInputs(IN.normalOS, IN.tangentOS);

                OUT.positionCS  = posInputs.positionCS;
                OUT.positionWS  = posInputs.positionWS;
                OUT.uv          = TRANSFORM_TEX(IN.uv, _BaseMap);
                OUT.normalWS    = nrmInputs.normalWS;
                OUT.tangentWS   = nrmInputs.tangentWS;
                OUT.bitangentWS = nrmInputs.bitangentWS;
                OUT.fogFactor   = ComputeFogFactor(posInputs.positionCS.z);
                OUT.shadowCoord = GetShadowCoord(posInputs);
                return OUT;
            }

            half4 ToonFrag(Varyings IN) : SV_Target
            {
                // Normal (with normal map)
                half3 normalTS = UnpackNormalScale(
                    SAMPLE_TEXTURE2D(_BumpMap, sampler_BumpMap, IN.uv), _BumpScale);
                float3x3 TBN = float3x3(IN.tangentWS, IN.bitangentWS, IN.normalWS);
                float3 N = normalize(mul(normalTS, TBN));

                // View & light vectors
                float3 V = normalize(GetCameraPositionWS() - IN.positionWS);

                Light mainLight = GetMainLight(IN.shadowCoord);
                float3 L = mainLight.direction;
                float3 H = normalize(L + V);

                float ndotl    = dot(N, L) * 0.5 + 0.5;
                float shadow   = mainLight.shadowAttenuation;
                float ndotlSh  = ndotl * shadow;

                // ── Cel bands ─────────────────────────────────────────────
                float shadowMask = 1.0 - CelStep(ndotlSh, _ShadowThreshold, _ShadowFeather);
                float midMask    = CelStep(ndotl, _MidThreshold, _MidFeather);
                float highMask   = CelStep(dot(N, H), _SpecThreshold, _HighFeather);

                // ── Base albedo ───────────────────────────────────────────
                half4 albedo = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv) * _BaseColor;

                // ── Toon color composite ──────────────────────────────────
                half3 lit    = albedo.rgb;
                lit = lerp(lit * _ShadowColor.rgb, lit, 1.0 - shadowMask * _ShadowColor.a);
                lit = lerp(lit, lit * _HighColor.rgb, midMask * 0.35);

                // ── Specular cel dot ──────────────────────────────────────
                float specAtten = CelStep(
                    pow(max(0, dot(N, H)), exp2(_SpecSmooth * 10.0)),
                    _SpecThreshold, _HighFeather);
                lit += _SpecColor.rgb * specAtten * _SpecColor.a;

                // ── Rim light ─────────────────────────────────────────────
                float rim = 1.0 - saturate(dot(V, N));
                rim = pow(rim, _RimPow);
                lit += _RimColor.rgb * rim * _RimStrength;

                // ── Additional lights (cel, no shadows) ───────────────────
                #ifdef _ADDITIONAL_LIGHTS
                uint count = GetAdditionalLightsCount();
                for (uint i = 0u; i < count; ++i)
                {
                    Light al = GetAdditionalLight(i, IN.positionWS);
                    float atten = CelStep(dot(N, al.direction) * 0.5 + 0.5,
                                         _ShadowThreshold, _ShadowFeather);
                    lit += albedo.rgb * al.color * atten * al.distanceAttenuation * 0.5;
                }
                #endif

                // ── Emission ──────────────────────────────────────────────
                half3 emission = SAMPLE_TEXTURE2D(_EmissionMap, sampler_EmissionMap, IN.uv).rgb
                                 * _EmissionColor.rgb;
                lit += emission;

                lit = MixFog(lit, IN.fogFactor);
                return half4(lit, albedo.a);
            }
            ENDHLSL
        }

        // ══════════════════════════════════════════════════════════════════
        // Pass 3 — Shadow caster
        // ══════════════════════════════════════════════════════════════════
        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }
            ZWrite On ZTest LEqual Cull Back

            HLSLPROGRAM
            #pragma vertex   ShadowVert
            #pragma fragment ShadowFrag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float4 _BaseMap_ST;
                float  _Cutoff;
            CBUFFER_END

            struct Attrib { float4 pos : POSITION; float3 nrm : NORMAL; };
            struct Vary   { float4 cs  : SV_POSITION; };

            Vary ShadowVert(Attrib IN)
            {
                Vary OUT;
                float3 posWS = TransformObjectToWorld(IN.pos.xyz);
                float3 nrmWS = TransformObjectToWorldNormal(IN.nrm);
                float4 posCS = TransformWorldToHClip(ApplyShadowBias(posWS, nrmWS, GetMainLightPosition().xyz - posWS));
                #if UNITY_REVERSED_Z
                    posCS.z = min(posCS.z, posCS.w * UNITY_NEAR_CLIP_VALUE);
                #else
                    posCS.z = max(posCS.z, posCS.w * UNITY_NEAR_CLIP_VALUE);
                #endif
                OUT.cs = posCS;
                return OUT;
            }
            half4 ShadowFrag(Vary IN) : SV_Target { return 0; }
            ENDHLSL
        }

        // ══════════════════════════════════════════════════════════════════
        // Pass 4 — Depth / normals (for SSAO, etc.)
        // ══════════════════════════════════════════════════════════════════
        Pass
        {
            Name "DepthNormals"
            Tags { "LightMode" = "DepthNormals" }
            ZWrite On Cull Back

            HLSLPROGRAM
            #pragma vertex   DepthNormVert
            #pragma fragment DepthNormFrag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            CBUFFER_START(UnityPerMaterial) float4 _BaseMap_ST; CBUFFER_END

            struct Attrib { float4 pos : POSITION; float3 nrm : NORMAL; };
            struct Vary   { float4 cs  : SV_POSITION; float3 nrmWS : TEXCOORD0; };

            Vary DepthNormVert(Attrib IN)
            {
                Vary OUT;
                OUT.cs    = TransformObjectToHClip(IN.pos.xyz);
                OUT.nrmWS = TransformObjectToWorldNormal(IN.nrm);
                return OUT;
            }
            half4 DepthNormFrag(Vary IN) : SV_Target
            {
                return half4(PackNormalOctRectEncode(TransformWorldToViewDir(IN.nrmWS, true)), 0, 0);
            }
            ENDHLSL
        }
    }

    FallBack "Hidden/Universal Render Pipeline/FallbackError"
    CustomEditor "UnityEditor.Rendering.Universal.ShaderGUI.LitShader"
}
