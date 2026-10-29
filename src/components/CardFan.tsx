import { CrownArt, Suit } from './Icons'

export function CardFan({ small = false }: { small?: boolean }) {
  return (
    <div className={`card-fan ${small ? 'card-fan-small' : ''}`} aria-hidden="true">
      <div className="fan-orbit" />
      <div className="playing-card fan-card-back">
        <div className="card-back-pattern">
          <div className="card-back-emblem">
            <Suit name="diamond" size={36} />
          </div>
        </div>
      </div>
      <div className="playing-card fan-card-red">
        <div className="card-corner">
          K<Suit name="heart" size={22} />
        </div>
        <div className="red-card-center">
          <CrownArt />
          <span>Le roi du jeu</span>
        </div>
        <div className="card-corner corner-bottom">
          K<Suit name="heart" size={22} />
        </div>
      </div>
      <div className="playing-card fan-card-ace">
        <div className="card-inner-border" />
        <div className="card-corner">
          A<Suit size={23} />
        </div>
        <div className="ace-center">
          <span className="ace-kicker">TEMAN SEMEJA</span>
          <Suit size={88} />
          <span className="ace-brand">
            ceki<span>.</span>
          </span>
          <span className="ace-caption">kecil skornya, besar ceritanya.</span>
        </div>
        <div className="card-corner corner-bottom">
          A<Suit size={23} />
        </div>
      </div>
      <Suit name="diamond" size={20} className="floating-suit float-one" />
      <Suit name="club" size={27} className="floating-suit float-two" />
      <span className="fan-spark spark-one">✳</span>
      <span className="fan-spark spark-two">✦</span>
      <div className="fan-note">
        yang penting,
        <br />
        ngumpulnya.
        <svg viewBox="0 0 78 30">
          <path d="M3 8q40 17 65 2m-8-5 11 4-7 9" />
        </svg>
      </div>
    </div>
  )
}
