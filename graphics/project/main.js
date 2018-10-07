/* Can show animated models of a horse and of a stork.
   The basic outline is the same as my sample program
   json-model-viewer.html, but the animation technique
   was lifted from the example canvas_morphtargets_horse.html
   that is part of the three.js download. */

var canvas, scene, renderer, camera;

var animating = false;

var mixer = null;  // The object that animates the model, of type THREE.AnimationMixer
var MIXER_LIST = [];
var OBJECT_LIST = [];
var TRANSLATING_OBJECTS = [];
var REMOVING_OBJECT_POSITION;
var ANIMALS = [];
var SPOT_LIGHT;
var prevMixerTime; // Used to record time of last update of mixer

var DISK_WORLD_MODEL;
var SUN;
var THETA_SUN = 0;
var LIGHT_SUN;

var controls;  // A TrackballControls object that is used to implement
               // rotation of the scene using the mouse.  (It actually rotates
               // the camera around the scene.)

var model = null; // The three.js object that represents the current model.

var modelDirectory = "https://raw.githubusercontent.com/sontung/sontung.github.io/master/graphics/misc/models-json/"; // Folder containing model files, relative to this HTML file.

var modelFileNames = [  // names of the model files
    "horse.js",
    "stork.js"
];

//var modelRotations = [ // rotations to be applied to models.
//    [Math.PI/8,Math.PI/2,0],
//    [Math.PI/8,Math.PI/2,0],
//];

var modelRotations = [ // rotations to be applied to models.
    [0, Math.PI/2, 0],
    [0, Math.PI/2, 0]
];


/**
 *  The render function draws the scene.
 */
function render() {
    renderer.render(scene, camera);
}


/*  This function is called by the init() method to create the world.  In this program,
 *  it just creates a light and a camera.  The model will be added in modelLoaded,
 *  after the model has been loaded.
 */
function createWorld() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, canvas.width/canvas.height, 0.1, 100);
    camera.position.z = 40;
    camera.position.y = 40;
    console.log("Camera pos:", camera.position);
    // scene.add(new THREE.CameraHelper(camera));
    scene.add(camera);

    // Create the main diskworld model.
	DISK_WORLD_MODEL = new THREE.Object3D();
	var ground = new THREE.Mesh(  // The base of the world; everything else is on the top of this cylinder.
	    new THREE.CylinderGeometry(16, 16, 0.5, 64, 1),
		new THREE.MeshLambertMaterial( { color: 0x00CC55 } )
	);
	ground.position.y = -0.3; // Puts top of cylinder just below the xz-plane.
	ground.receiveShadow = true;
	DISK_WORLD_MODEL.add(ground);

	add_tree();
	scene.add(DISK_WORLD_MODEL);

	var geometry2 = new THREE.SphereGeometry( 1, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2 );
    var material2 = new THREE.MeshBasicMaterial( {color: 0xFFFF00} );
    SUN = new THREE.Mesh( geometry2, material2 );
    SUN.position.set(0, 8, 0);
    LIGHT_SUN = new THREE.DirectionalLight(0xffffff, 0.8);
    LIGHT_SUN.shadow.mapSize.x = 512;
    LIGHT_SUN.shadow.mapSize.y = 1024;
    LIGHT_SUN.castShadow = true;

    LIGHT_SUN.shadow.camera = new THREE.OrthographicCamera( -16, 16, 16, -16, 1, 100 );

    console.log("light pos", LIGHT_SUN.position);
    console.log("cam pos", LIGHT_SUN.shadow.camera.position, LIGHT_SUN.shadow.mapSize);
    console.log(LIGHT_SUN.shadow.camera);
    scene.add(new THREE.CameraHelper(LIGHT_SUN.shadow.camera));

    SUN.add(LIGHT_SUN);
    DISK_WORLD_MODEL.add(SUN);
    console.log("Shadow map", LIGHT_SUN.shadow.map);
}

function add_tree() {
    var tree = new THREE.Object3D();
	var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2,0.2,1,16,1),
		new THREE.MeshLambertMaterial({
		    color: 0x885522
		})
	);
	trunk.position.y = 0.5;  // move base up to origin
	var leaves = new THREE.Mesh(
        new THREE.ConeGeometry(.7,2,16,3),
		new THREE.MeshPhongMaterial({
		    color: 0x00BB00,
			specular: 0x002000,
			shininess: 5
		})
	);
	trunk.castShadow = true;
	trunk.receiveShadow = true;
	leaves.castShadow = true;
	leaves.receiveShadow = true;
	leaves.position.y = 2;  // move bottom of cone to top of trunk
	tree.add(trunk);
	tree.add(leaves);

	// Add copies of the tree model to the world, with various sizes and positions.

    var start_x = -15.5;
    while (start_x < 15.5) {
        var constraint = Math.sqrt(Math.pow(15.5, 2)-Math.pow(start_x, 2));
        var start_z = -constraint;
        while (start_z < constraint) {
            start_z += 1;
            if (Math.pow(start_x, 2) + Math.pow(start_z, 2) > 240.25) {continue;}
            if (start_z >= 5 || start_z <= -5) {
                tree.position.set(start_x, 0, start_z);
                var rand = Math.random();
                tree.scale.set(rand, rand, rand);
                var a_tree = tree.clone();
                DISK_WORLD_MODEL.add(a_tree);
                TRANSLATING_OBJECTS.push(a_tree);
            }
        }
        start_x += 1;
    }

}

function doFrame() {
	if (animating && mixer) {
        var time = Date.now();
        for (var _j = 0; _j < MIXER_LIST.length; _j++) {
            MIXER_LIST[_j].update( ( time - prevMixerTime ) * 0.001 );
        }

        // remove out of plane trees
        REMOVING_OBJECT_POSITION = [];
        var _j = TRANSLATING_OBJECTS.length;
        while (_j--) {
            TRANSLATING_OBJECTS[_j].position.x -= 0.1;
            if (Math.pow(TRANSLATING_OBJECTS[_j].position.x, 2)+Math.pow(TRANSLATING_OBJECTS[_j].position.z, 2) > 240.25) {
                DISK_WORLD_MODEL.remove(TRANSLATING_OBJECTS[_j]);
                var new_pos = TRANSLATING_OBJECTS[_j].position.clone();
                new_pos.x = -new_pos.x;
                REMOVING_OBJECT_POSITION.push(new_pos);
                TRANSLATING_OBJECTS.splice(_j, 1);
            }
        }

        // substitute removed trees
        for (var _i=0; _i<REMOVING_OBJECT_POSITION.length; _i++) {
            add_tree_at(REMOVING_OBJECT_POSITION[_i]);
        }

        // update sun position
        if ( typeof SUN !== 'undefined') {
            SUN.position.x = 16*Math.cos(THETA_SUN);
            SUN.position.y = 16*Math.sin(THETA_SUN);
            THETA_SUN += 0.001;
            if (THETA_SUN > Math.PI*2) {THETA_SUN=0.0;}
        }

//        SPOT_LIGHT.position.y -= 0.5;
//        console.log(SPOT_LIGHT.position);
        prevMixerTime = time;
	    render();
		requestAnimationFrame(doFrame);
	}
}

function add_tree_at(position_vec) {
    var tree = new THREE.Object3D();
	var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2,0.2,1,16,1),
		new THREE.MeshLambertMaterial({
		    color: 0x885522
		})
	);
	trunk.position.y = 0.5;  // move base up to origin
	var leaves = new THREE.Mesh(
        new THREE.ConeGeometry(.7,2,16,3),
		new THREE.MeshPhongMaterial({
		    color: 0x00BB00,
			specular: 0x002000,
			shininess: 5
		})
	);
	leaves.position.y = 2;  // move bottom of cone to top of trunk
	trunk.castShadow = true;
	trunk.receiveShadow = true;
	leaves.castShadow = true;
	leaves.receiveShadow = true;
	tree.add(trunk);
	tree.add(leaves);
	tree.position.set(position_vec.x, 0, position_vec.z);
    var rand = Math.random();
    tree.scale.set(rand, rand, rand);
    var a_tree = tree.clone();
    DISK_WORLD_MODEL.add(a_tree);
    TRANSLATING_OBJECTS.push(a_tree);
}

function add_spot_light() {
    SPOT_LIGHT = new THREE.SpotLight( 0xffffff );
    SPOT_LIGHT.position.set( 0, 100, 0 );

    SPOT_LIGHT.castShadow = true;

    SPOT_LIGHT.shadow.mapSize.width = 1024;
    SPOT_LIGHT.shadow.mapSize.height = 1024;

    SPOT_LIGHT.shadow.camera.near = 500;
    SPOT_LIGHT.shadow.camera.far = 4000;
    SPOT_LIGHT.shadow.camera.fov = 30;

    DISK_WORLD_MODEL.add( SPOT_LIGHT );
}

/**
 * This function will be called when the JSONLoader has
 * finished loading a model.  This function creates a three.js
 * Mesh object to hold the model.  It translates the object so that
 * its center is at the origin.  It wraps the object in another object
 * that is used to scale and rotate the object.  The scale is set
 * so that the maximum coordinate in its vertices, in absolute
 * value, is scaled to 10.  The rotation is set to the second parameter,
 * which is used to set up an appropriate orientation for viewing
 * the model.
 */
function modelLoaded(geometry, rotation, centerX, centerY, centerZ) {

    /* create the object from the geometry was loaded, with a white material. */

    var material = new THREE.MeshLambertMaterial( {
        vertexColors: THREE.FaceColors,  // use colors from the geometry
        morphTargets: true
    });
    var object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
    object.receiveShadow = true;

    /* Determine the ranges of x, y, and z in the vertices of the geometry. */

    var xmin = Infinity;
    var xmax = -Infinity;
    var ymin = Infinity;
    var ymax = -Infinity;
    var zmin = Infinity;
    var zmax = -Infinity;
    for (var i = 0; i < geometry.vertices.length; i++) {
        var v = geometry.vertices[i];
        if (v.x < xmin)
            xmin = v.x;
        else if (v.x > xmax)
            xmax = v.x;
        if (v.y < ymin)
            ymin = v.y;
        else if (v.y > ymax)
            ymax = v.y;
        if (v.z < zmin)
            zmin = v.z;
        else if (v.z > zmax)
            zmax = v.z;
    }

    /* translate the center of the object to the origin */
//    var centerX = (xmin+xmax)/2;
//    var centerY = (ymin+ymax)/2;
//    var centerZ = (zmin+zmax)/2;

    var scale = 0.01;
    object.position.set(centerX, centerY, centerZ);
    if (window.console) {
       console.log("Loading finished, scaling object by " + scale);
       console.log("Center at ( " + centerX + ", " + centerY + ", " + centerZ + " )");
    }

    /* Create the wrapper, model, to scale and rotate the object. */

    model = new THREE.Object3D();
    model.add(object);
    model.scale.set(scale, scale, scale);
    model.rotation.set(rotation[0], rotation[1], rotation[2]);
    model.position.set(4.93, 0, 0);
    DISK_WORLD_MODEL.add(model);
    mixer = new THREE.AnimationMixer( object );
    MIXER_LIST.push(mixer);
    OBJECT_LIST.push(model);
    ANIMALS.push(model);
	var clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'motion', geometry.morphTargets, 30 );
    var animationAction = mixer.clipAction(clip);
    animationAction.setDuration(1);
    animationAction.play();  // Note that it is the mixer.update() in doFrame() that actually drives the animation.
    document.getElementById("animate").disabled  = false;
    render();
}


/**
 * Called when the setting of the model-selection radio buttons is changed.
 * starts loading the model from the specified file.  When the model has
 * has been loaded, the function modelLoaded() will be called.
 */
function installModel(modelNumber) {
    function callback(geometry,material) {  // callback function to be executed when loading finishes.
        if (modelNumber === 0) {
            modelLoaded(geometry, modelRotations[modelNumber], 0, 0, 0);
        }
        else {
            modelLoaded(geometry, modelRotations[modelNumber], 0, 400, 0);
        }
    }
    if (model) {
        scene.remove(model);
    }
    controls.reset();  // return camera to original position.
    mixer = null;  // delete the animator used by current model, if any
    render();  // draw without model while loading
    if (animating) { // turn off animation.
       document.getElementById("animate").checked = false;
       doAnimationCheckbox();
    }
    document.getElementById("animate").disabled = true;
    var loader = new THREE.JSONLoader();
    try {
        loader.load(modelDirectory + modelFileNames[modelNumber], callback);
    }
    catch (e) {
        // Note: Will give an error if loading from the local file system
        // on some browsers (Chrome, at least).
        document.getElementById("headline").innerHTML =
            "Could not load model! Note that some browsers<br>can't load models from a local disk.";
    }
}



/*  This page uses THREE.TrackballControls to let the user use the mouse to rotate
 *  the view.  TrackballControls are designed to be used during an animation, where
 *  the rotation is updated as part of preparing for the next frame.  The scene
 *  is not automatically updated just because the user drags the mouse.  To get
 *  the rotation to work without animation, I add another mouse listener to the
 *  canvas, just to call the render() function when the user drags the mouse.
 *  The same thing holds for touch events -- I call render for any mouse move
 *  event with one touch.
 */
function installTrackballControls() {
    controls = new THREE.TrackballControls(camera,canvas);
    controls.noPan = true;
    controls.noZoom = true;
    controls.staticMoving = true;
    function move() {
        controls.update();
		if (!animating) {
			render();
		}
    }
    function down() {
        document.addEventListener("mousemove", move, false);
    }
    function up() {
        document.removeEventListener("mousemove", move, false);
    }
    function touch(event) {
        if (event.touches.length === 1) {
            move();
        }
    }
    canvas.addEventListener("mousedown", down, false);
    canvas.addEventListener("touchmove", touch, false);
}


function resetControls() {
    controls.reset();
    if (!animating) {
      render();
    }
}


//--------------------------- animation support -----------------------------------

var prevTime;  // For keeping track of time between calls to morphAnimator.update.

function startAnimation() {
    if (!animating) {
       prevTime = Date.now();
	   animating = true;
       prevMixerTime = Date.now();
	   requestAnimationFrame(doFrame);
	}
}

function pauseAnimation() {
	if (animating) {
	    animating = false;
	}
}

function doAnimationCheckbox() {
    var anim = document.getElementById("animate").checked;
    if ( anim === animating ) { // should not happen
      return;
    }
    if ( anim )
    	startAnimation();
    else
    	pauseAnimation();
}

//----------------------------------------------------------------------------------

function init() {
    try {
        canvas = document.getElementById("maincanvas");
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML="<p><b>Sorry, an error occurred:<br>" +
                e + "</b></p>";
        return;
    }
    document.getElementById("animate").checked = false;
    document.getElementById("animate").onchange = doAnimationCheckbox;
    renderer.setClearColor(0xAAAAAA);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;


    createWorld();
    installTrackballControls();
    installModel(0);
    console.log(renderer);
    // installModel(1);
//    add_spot_light();
}

