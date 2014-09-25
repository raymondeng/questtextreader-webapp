/** @jsx React.DOM */
  
var Footer = React.createClass({
  render: function () {
    return (
      <footer>
        <label htmlFor="name">Name:</label>
        <input id="name" ref="name" type="text" value={this.props.name} onChange={this.props.createOnChange('name')} />
        <label htmlFor="sex">Sex:</label>
        <select id="sex" ref="sex" value={this.props.sex} onChange={this.props.createOnChange("sex")}>
          <option value="1">Neutrum</option>
          <option value="2">Male</option>
          <option value="3">Female</option>
        </select>
        <label htmlFor="race">Race:</label>
        <select id="race" ref="race" value={this.props.race} onChange={this.props.createOnChange("race")}>
          <option>Pandaren</option>
          <option>Worgen</option>
          <option>Goblin</option>
          <option>Draenei</option>
          <option>Blood Elf</option>
          <option>Dwarf</option>
          <option>Orc</option>
          <option>Gnome</option>
          <option>Tauren</option>
          <option>Human</option>
          <option>Troll</option>
          <option>Night Elf</option>
          <option>Undead</option>
        </select>
        <label htmlFor="class">Class:</label>
        <select id="class" ref="class" value={this.props.class} onChange={this.props.createOnChange('class')} >
          <option>Warrior</option>
          <option>Paladin</option>
          <option>Hunter</option>
          <option>Rogue</option>
          <option>Priest</option>
          <option>Death Knight</option>
          <option>Shaman</option>
          <option>Mage</option>
          <option>Warlock</option>
          <option>Monk</option>
          <option>Druid</option>
        </select>
        <span className="pull-right">
          <span>By </span>
          <a href="https://twitter.com/cell303">@cell303</a>
        </span>
      </footer>);
  }
});

module.exports = Footer;
