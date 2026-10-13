import './style.css';
import shaderCode from './shaders/shader.wesl?static';

const canvas = document.querySelector('canvas')!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* `?static` links the WESL file at build time and gives us plain WGSL as a string. */
console.log(shaderCode);
