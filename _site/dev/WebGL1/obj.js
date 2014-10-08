function mesh()
{
	//submeshes is an array of vbo handles
	//no actual mesh data is stored after it is
	//passed to gl
	this.submeshes = [];

	this.vertexSize = 3;
	this.normalOffset = 3;
	this.normalSize = 3;
	this.texcoordSize = 2;
	this.texcoordOffset = 6;
}


function loadObjFile(url)
{
	var m = new mesh();

	getFileFromURL(url, function(text)
	{
		if (text == null)
		{
			return null;
		}
		else
		{
			var lines = text.split('\n');
			var curSubmesh = -1;
			var iter = 0;
			var objectCount = 0;

			var verts = [];
			var texcoords = [];
			var normals = [];
			var faces = [];
			var meshData = [];

			for (var i = 0; i < lines.length; i++)
			{
				var elements = lines[i].split(' ');

				if (elements[0] == "v")
				{
					for(var j = 1; j < elements.length; j++)
					{
						verts.push(parseFloat(elements[j]));
					}
				}
				else if (elements[0] == "vt")
				{
					for(var j = 1; j < elements.length; j++)
					{
						texcoords.push(parseFloat(elements[j]));
					}
				}
				else if (elements[0] == "vn")
				{
					for (var j = 1; j < elements.length; j++)
					{
						normals.push(parseFloat(elements[j]));
					} 
				}
				//don't keep track of matrial names
				//just make sure that verts on different materials
				//belong to the correct submesh
				else if (elements[0] == "usemtl")
				{
					curSubmesh++;
				}
				else if (elements[0] == "f")
				{
					//each face line splits into f vert1 vert2 vert3
					for (var j = 1; j < 4; j++)
					{
						//split each v/t/n into 3 element array
						var vtn = elements[j].split('/');
						
						//built vertex array without indices for now
						//todo: fix this later if we ever need to handle much larger meshes
						meshData[curSubmesh][iter++] = verts[vtn[0]*3];
						meshData[curSubmesh][iter++] = verts[vtn[0]*3+1];
						meshData[curSubmesh][iter++] = verts[vtn[0]*3+2];
						meshData[curSubmesh][iter++] = texcoords[vtn[1]*2];
						meshData[curSubmesh][iter++] = texcoords[vtn[1]*2+1];
						meshData[curSubmesh][iter++] = normals[vtn[2]*3];
						meshData[curSubmesh][iter++] = normals[vtn[2]*3+1];
						meshData[curSubmesh][iter++] = normals[vtn[2]*3+2];
					}
				}
				else if ( elements[0] == "o")
				{
					objectCount++;
					if (objectCount > 1)
					{
						console.log("obj files with multiple objects are not supported");
						return null;
					}
				}
			}

			for (var i = 0; i < meshData.length; i++)
			{
				for (var j = 0; j < meshData[i].length; j++)
				{
					console.log(meshData[i][j]);
				}
			}

			return m;
		}
	});
}

function getFileFromURL(url, doneCallback)
{
	var request = new XMLHttpRequest();
	request.onreadystatechnage = handleStateChange;
	request.open("GET", url, true);
	request.send();

	function handleStateChange()
	{
		if (request.readyState == 4)
		{
			doneCallback(request.status == 200 ? request.responseText : null);
		}
	}
}