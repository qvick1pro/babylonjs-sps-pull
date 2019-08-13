import * as BABYLON from 'babylonjs';


export class SolidParticlePullSystem extends BABYLON.SolidParticleSystem {

  /**
   * 
   * @type {Array<PullParticle>}
   */
  activeParticlesPull = [];

  /**
   * 
   * @type {Array<PullParticle>}
   */
  inactiveParticlesPull = [];

  /**
   * 
   * @type {Object<SolidParticle, PullParticle>}
   */
  _pullParticlesMap = {};

  /**
   * 
   * @param {string} name 
   * @param {BABYLON.Mesh} baseMesh 
   * @param {number} particlesCount 
   * @param {BABYLON.Scene} scene 
   */
  constructor(name, baseMesh, particlesCount, scene) {
    super(name, scene);
    this.addShape(baseMesh, particlesCount);
    this.buildMesh();
    this.mesh.position = new BABYLON.Vector3();
    this.isAlwaysVisible = true;
  }

  initParticles() {
    this.particles.forEach(particle => {
      const pullParticle = new PullParticle(particle, this);
      this._pullParticlesMap[particle] = pullParticle;
      this._freeParticle(pullParticle);
    });
  }

  beforeUpdateParticles() {
    this.activeParticlesPull.forEach(pullParticle => {
      const currentTime = Date.now();
      const startTime = pullParticle.activationTime;
      const dt = currentTime - startTime;

      const isAlive = pullParticle.updateFunction(pullParticle.particle, dt, startTime, currentTime);

      if (!isAlive) {
        this._freeParticle(pullParticle);
      }
    });
  }

  _activeteFreeParticle() {
    let pullParticle = null;

    if (this.inactiveParticlesPull.length > 0) {
      pullParticle = this.inactiveParticlesPull.pop();
    }
    else {
      pullParticle = this.activeParticlesPull.shift();
    }

    if (typeof this.onActivation === 'function') {
      this.onActivation(pullParticle.particle);
    }

    this.activeParticlesPull.push(pullParticle);
    pullParticle.particle.isVisible = true;
    pullParticle.activationTime = Date.now() - 1;

    return pullParticle;
  }

  /**
   * 
   * @param {PullParticle} pullParticle 
   */
  _freeParticle(pullParticle) {
    const activePullIndex = this.activeParticlesPull.indexOf(pullParticle);

    if (~activePullIndex) {
      this.activeParticlesPull.splice(activePullIndex, 1);
    }

    this.inactiveParticlesPull.push(pullParticle);
    pullParticle.activationTime = 0;
    pullParticle.updateFunction = null;
    pullParticle.particle.isVisible = false;
  }

  /**
   * 
   * @param {number} particlesCount 
   * @param {function} updateFunction 
   */
  activate(particlesCount, updateFunction) {
    if (!updateFunction) {
      throw 'Particle activation must have update function';
    }

    const pullParticles = [];

    while (pullParticles.length < particlesCount) {
      pullParticles.push(this._activeteFreeParticle());
    }

    pullParticles.forEach(pullParticle => {
      pullParticle.updateFunction = updateFunction;
    });

    return pullParticles.map(pullParticle => pullParticle.particle);
  }

}

export class PullParticle {

  /**
   * 
   * @type {BABYLON.SolidParticle}
   */
  particle = null;

  /**
   * 
   * @type {SolidParticlePullSystem}
   */
  system = null;

  /**
   * 
   * @type {Function}
   */
  updateFunction = null;

  /**
   * 
   * @type {number}
   */
  activationTime = null;

  /**
   * 
   * @param {BABYLON.SolidParticle} particle 
   * @param {SolidParticlePullSystem} system 
   */
  constructor(particle, system) {
    this.particle = particle;
    this.system = system;
  }

}
