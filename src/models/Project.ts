export class Project {
  public id: string;
  public name: string;
  public description: string;
  public createdAt: string;

  constructor(
    id: string,
    name: string,
    description: string,
    createdAt: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
  }
}
