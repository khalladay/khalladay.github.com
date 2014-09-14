var GL;

function webGLStart()
{
	var CANVAS = document.getElementById("glCanvas");

	try
	{
		GL = CANVAS.getContext("experimental-webgl", {antialias: true});
	}
	catch(e)
	{
		console.log("Your browser is not WebGL compatible. Try opening this page with Chrome or Firefox");
		return false;
	}
	if (!GL)console.log("oops");
	
	loadObjFile("cube.obj");
	loadShader(GL, "vs_passthrough", "fs_unlit");
	buildCube(GL);
	animate(CANVAS);
}

function animate(canvas)
{
	GL.viewport(0.0,0.0,canvas.width, canvas.height);
	GL.clearColor(1.0,0.0,0.0,1.0);
	GL.clear(GL.COLOR_BUFFER_BIT);
	GL.flush();

	window.requestAnimationFrame(animate);
}

function loadShader(glContext, vSourceId, fSourceId)
{
	var shaderText = document.getElementById(vSourceId);

	if (!shaderText)
	{
		console.log("Can't find shader source");
		return null;
	}

	var vshader = glContext.createShader(glContext.VERTEX_SHADER);
	glContext.shaderSource(vshader, shaderText.firstChild);
	glContext.compileShader(vshader);

	shaderText = document.getElementById(fSourceId);
	if (!shaderText)
	{
		console.log("Can't find shader source");
		return null;
	}

	var fshader = glContext.createShader(glContext.FRAGMENT_SHADER);
	glContext.shaderSource(fshader, shaderText.firstChild);
	glContext.compileShader(fshader);

	var shader = glContext.createProgram();
	glContext.attachShader(shader, vshader);
	glContext.attachShader(shader, fshader);
	glContext.linkProgram(shader);

	return shader;
}

function buildCube(gl)
{
	var verts = [-0.5,-0.5,-0.5]
}