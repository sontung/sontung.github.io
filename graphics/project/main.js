var canvas, scene, renderer, camera;

var animating = false;

var mixer = null;  // The object that animates the model, of type THREE.AnimationMixer
var MIXER_LIST = [];
var OBJECT_LIST = [];
var TRANSLATING_OBJECTS = [];
var REMOVING_OBJECT_POSITION;
var ANIMALS = [];

var prevMixerTime; // Used to record time of last update of mixer

var DISK_WORLD_MODEL;
var SUN;
var THETA_SUN = 0;
var LIGHT_SUN;
var LIGHT_SUN_CAM_HELPER;
var SPOT_LIGHT;
var SPOT_LIGHT_CAM_HELPER;
var SPOT_LIGHT_ADDED = false;
var CAM_HELPER = false;

var CAM_POSITIONS = {
    0: [17.6, 2.72, 5.44],
    1: [-21.13, 19.09, 10.55],
    2: [0, 40, 40]
};

var CAM_ROTATIONS = {
    0: [-0.42, 1.04, 0.09],
    1: [-0.89, -0.96, -0.95],
    2: [-0.78, 0, 0]
};

var CURRENT_CAM_VIEW = 2;

var controls;  // A TrackballControls object that is used to implement
               // rotation of the scene using the mouse.  (It actually rotates
               // the camera around the scene.)


var modelDirectory = "https://raw.githubusercontent.com/sontung/sontung.github.io/master/graphics/misc/models-gltf/";

var modelFileNames = [  // names of the model files
    "Horse.glb",
    "Stork.glb",
    "Flamingo.glb",
    "Parrot.glb"
];

var ANIMAL_NUMBERS = [12, 4, 5, 2];

var ANIMAL_POSITIONS = {};
for (var idx=0; idx<modelFileNames.length; idx++) {
    ANIMAL_POSITIONS[idx] = [];
}

var MOVE_SCENE = false;
var memoryInfo = window.performance.memory;

function render() {
    renderer.render(scene, camera);
    console.log("animals", ANIMALS.length, "trees", TRANSLATING_OBJECTS.length, "mem used", memoryInfo.usedJsHeapSize);
}
function createWorld() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, canvas.width/canvas.height, 0.1, 100);
    camera.position.set(
        CAM_POSITIONS[CURRENT_CAM_VIEW][0],
        CAM_POSITIONS[CURRENT_CAM_VIEW][1],
        CAM_POSITIONS[CURRENT_CAM_VIEW][2]);
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
    LIGHT_SUN_CAM_HELPER = new THREE.CameraHelper(LIGHT_SUN.shadow.camera);

    SUN.add(LIGHT_SUN);
    DISK_WORLD_MODEL.add(SUN);
}

function add_spot_light() {
    SPOT_LIGHT = new THREE.SpotLight( 0xffffff );
    SPOT_LIGHT.position.set( 0, 10, 0 );
    SPOT_LIGHT.castShadow = true;
    SPOT_LIGHT.distance = 30;

    SPOT_LIGHT.shadow.camera.fov = 10;
    SPOT_LIGHT.shadow.camera.far = 20;

    SPOT_LIGHT_CAM_HELPER = new THREE.SpotLightHelper( SPOT_LIGHT );
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

        // tree animation
        if (MOVE_SCENE) {
            // remove out of plane trees
            REMOVING_OBJECT_POSITION = [];
            _j = TRANSLATING_OBJECTS.length;
            while (_j--) {
                TRANSLATING_OBJECTS[_j].position.x -= 0.1;
                if (Math.pow(TRANSLATING_OBJECTS[_j].position.x, 2) + Math.pow(TRANSLATING_OBJECTS[_j].position.z, 2) > 240.25) {
                    DISK_WORLD_MODEL.remove(TRANSLATING_OBJECTS[_j]);
                    var new_pos = TRANSLATING_OBJECTS[_j].position.clone();
                    new_pos.x = -new_pos.x;
                    REMOVING_OBJECT_POSITION.push(new_pos);
                    TRANSLATING_OBJECTS.splice(_j, 1);
                }
            }

            // substitute removed trees
            for (var _i = 0; _i < REMOVING_OBJECT_POSITION.length; _i++) {
                add_tree_at(REMOVING_OBJECT_POSITION[_i]);
            }

        // animal animation
        } else {
            // remove out of plane animals
            var _z = ANIMALS.length;
            var removed = 0;
            while (_z--) {
                ANIMALS[_z].position.x += 0.1;
                if (Math.pow(ANIMALS[_z].position.x, 2) + Math.pow(ANIMALS[_z].position.z, 2) > 240.25) {
                    DISK_WORLD_MODEL.remove(ANIMALS[_z]);
                    ANIMALS.splice(_z, 1);
                    removed++;
                }
            }

            // substitute random animals
            for (var _f=0; _f<removed; _f++) {
                var which_animal = getRandomInt(0, 4);
                var pos_z = getRandomArbitrary(-4, 4);
                var pos_y = (which_animal>0)*5 + which_animal*0.5;
                var pos_x = -Math.sqrt(Math.pow(14.5, 2) - Math.pow(pos_z, 2));
                installModel(which_animal, 1, new THREE.Vector3(pos_x, pos_y, pos_z));
            }

        }

        // update sun position
        if ( typeof SUN !== 'undefined') {
            SUN.position.x = 16*Math.cos(THETA_SUN);
            SUN.position.y = 16*Math.sin(THETA_SUN);
            THETA_SUN += 0.01;
            if (THETA_SUN > Math.PI*2) {THETA_SUN=0.0;}
        }

        doSpotLightCheckbox();

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

function modelLoaded(mesh, clip, position) {

    var object = mesh.clone();

    object.material = mesh.material.clone();
    object.castShadow = true;
    object.receiveShadow = true;

    var scale = 0.01;

    /* Create the wrapper, model, to scale and rotate the object. */

    var model = new THREE.Object3D();
    model.add(object);
    model.scale.set(scale, scale, scale);
    model.rotation.y = Math.PI/2;
    model.position.set(position.x, position.y, position.z);
    DISK_WORLD_MODEL.add(model);

    mixer = new THREE.AnimationMixer( object );
    MIXER_LIST.push(mixer);
    OBJECT_LIST.push(model);
    ANIMALS.push(model);
    var animationAction = mixer.clipAction(clip);
    animationAction.setDuration(getRandomArbitrary(0.5, 1.5));
    animationAction.play();
    document.getElementById("animate").disabled  = false;
    render();
}

function installModel(modelNumber, number, where=null) {

    function callback(gltf) {  // callback function to be executed when loading finishes.
        var mesh = gltf.scene.children[ 0 ];
        var clip = gltf.animations[ 0 ];
        var a_random_pos;
        for (var _i=0; _i<number; _i++) {
            if (where === null) {
                a_random_pos = random_spawning(modelNumber);
                modelLoaded(mesh, clip, a_random_pos);
            } else {
                modelLoaded(mesh, clip, where);
            }
        }
    }

    // controls.reset();  // return camera to original position.
    // mixer = null;  // delete the animator used by current model, if any
    // render();  // draw without model while loading
    // if (animating) { // turn off animation.
    //    document.getElementById("animate").checked = false;
    //    doAnimationCheckbox();
    // }
    // document.getElementById("animate").disabled = true;

    var loader = new THREE.GLTFLoader();
    loader.load(modelDirectory + modelFileNames[modelNumber], callback);
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function random_spawning(model_number) {
    var curr_pos;
    var a_height = (model_number>0)*5 + model_number*0.5;
    while (1) {
        var pos_x = getRandomArbitrary(-14.5, 14.5);
        var constraint1 = Math.sqrt(Math.pow(14.5, 2) - Math.pow(pos_x, 2));
        var constraint2 = 4;
        var pos_z = getRandomArbitrary(
            Math.max(-constraint1, -constraint2),
            Math.min(constraint1, constraint2));

        curr_pos = new THREE.Vector2(pos_x, pos_z);

        if (ANIMAL_POSITIONS[model_number].length === 0) {
            ANIMAL_POSITIONS[model_number].push(curr_pos);
            return new THREE.Vector3(pos_x, a_height, pos_z);
        }
        var distance = [];
        for (var _idx=0; _idx<ANIMAL_POSITIONS[model_number].length; _idx++) {
            distance.push(curr_pos.distanceTo(ANIMAL_POSITIONS[model_number][_idx]));
        }
        if (Math.min.apply(null, distance) > 4) {
            ANIMAL_POSITIONS[model_number].push(curr_pos);
            break;
        }
    }
    return new THREE.Vector3(pos_x, a_height, pos_z);
}

function installTrackballControls() {
    controls = new THREE.TrackballControls(camera, canvas);
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

function change_cam_view() {
    CURRENT_CAM_VIEW = (CURRENT_CAM_VIEW+1) % 3;
    console.log(CURRENT_CAM_VIEW);
    camera.position.set(
        CAM_POSITIONS[CURRENT_CAM_VIEW][0],
        CAM_POSITIONS[CURRENT_CAM_VIEW][1],
        CAM_POSITIONS[CURRENT_CAM_VIEW][2]);
    camera.rotation.set(
        CAM_ROTATIONS[CURRENT_CAM_VIEW][0],
        CAM_ROTATIONS[CURRENT_CAM_VIEW][1],
        CAM_ROTATIONS[CURRENT_CAM_VIEW][2]);
}

function change_animation() {
    MOVE_SCENE = !MOVE_SCENE;
}

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

function doSpotLightCheckbox() {
    if (Math.PI < THETA_SUN) {
        DISK_WORLD_MODEL.add(SPOT_LIGHT);
        SPOT_LIGHT_ADDED = true;
        if (CAM_HELPER) {
            scene.add(SPOT_LIGHT_CAM_HELPER);
        }
    } else {
        DISK_WORLD_MODEL.remove(SPOT_LIGHT);
        scene.remove(SPOT_LIGHT_CAM_HELPER);
        SPOT_LIGHT_ADDED = false;
    }
}

function doCamHelperCheckbox() {
    if (!CAM_HELPER) {
        scene.add(LIGHT_SUN_CAM_HELPER);
        if (SPOT_LIGHT_ADDED) {
            scene.add(SPOT_LIGHT_CAM_HELPER);
        }
        CAM_HELPER = true;
    } else {
        scene.remove(LIGHT_SUN_CAM_HELPER);
        scene.remove(SPOT_LIGHT_CAM_HELPER);
        CAM_HELPER = false;
    }
}

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
    document.getElementById("animate").onchange = doAnimationCheckbox;
    document.getElementById("camhelper").onchange = doCamHelperCheckbox;

    renderer.setClearColor(0xAAAAAA);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;


    createWorld();
    installTrackballControls();

    for (var _i=0; _i<modelFileNames.length; _i++) {
        installModel(_i, ANIMAL_NUMBERS[_i]);
    }
    add_spot_light();
}

